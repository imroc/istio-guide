# 深入分析实现原理

## 出方向流量分析

### 流量拦截原理

流量路径:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221009140434.png)

iptables 在 PREROUTING 链上匹配源 IP 是本节点中网格内的 Pod IP 的 TCP 数据包，打上 0x100 的 mark:

```txt
-A ztunnel-PREROUTING -p tcp -m set --match-set ztunnel-pods-ips src -j MARK --set-xmark 0x100/0x100
```

用 ipset 可以看到 `ztunnel-pods-ips` 正是本节点中网格内的 POD IP 列表:

```txt
$ ipset list
Name: ztunnel-pods-ips
Type: hash:ip
Revision: 0
Header: family inet hashsize 1024 maxelem 65536
Size in memory: 440
References: 1
Number of entries: 2
Members:
10.244.1.4
10.244.1.5
```

在策略路由可以看到，打上 0x100 mark 的数据包，会走 101 号路由表进行路由:

```bash
$ ip rule list
101:	from all fwmark 0x100/0x100 lookup 101
```

查看路由，会经过 `istioout` 网卡，使用 `192.168.127.2` 这个默认网关进行路由:

```bash
$ ip route show table 101
default via 192.168.127.2 dev istioout
10.244.1.3 dev vethf18f80e0 scope link
```

查看 `istioout` 网卡，是 `geneve` 类型的虚拟网卡，`remote` 是 `10.244.1.3`:

```bash
$ ip -d a s istioout
5: istioout: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default
    link/ether 26:04:92:96:1b:67 brd ff:ff:ff:ff:ff:ff promiscuity 0 minmtu 68 maxmtu 65485
    geneve id 1001 remote 10.244.1.3 ttl auto dstport 6081 noudpcsum udp6zerocsumrx numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535
    inet 192.168.127.1/30 brd 192.168.127.3 scope global istioout
       valid_lft forever preferred_lft forever
```

而 `10.244.1.3` 是本节点上的 ztunnel pod ip:

```bash
$ kubectl -n istio-system get pod -o wide | grep 10.244.1.3
ztunnel-27nxh                           1/1     Running   0          3d3h   10.244.1.3   ambient-worker          <none>           <none>
```

前面提到的默认网关 `192.168.127.2` 也正是 ztunnel 内的 `pistioout` 网卡的 IP:

```bash
$ kubectl -n istio-system exec -it ztunnel-27nxh -- ip -d a s
4: pistioout: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default qlen 1000
    link/ether 76:b0:37:d7:16:93 brd ff:ff:ff:ff:ff:ff promiscuity 0 minmtu 68 maxmtu 65485
    geneve id 1001 remote 10.244.1.1 ttl auto dstport 6081 noudpcsum udp6zerocsumrx numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535
    inet 192.168.127.2/30 scope global pistioout
       valid_lft forever preferred_lft forever
    inet6 fe80::74b0:37ff:fed7:1693/64 scope link
       valid_lft forever preferred_lft forever
```

也就是说，节点内的 `istioout` 和 ztunnel pod 内的 `pistioout` 网卡通过 geneve tunnel 打通了，`istioout` 收到数据包后立即会转到 ztunnel 内的 `pistioout` 网卡。

所以串起来就是，从本节点网格内的 Pod 中发出的 TCP 流量，会被策略路由转发到 ztunnel pod 内的 `pistioout` 网卡。

而在 ztunnel 内的 `pistioout` 网卡收到流量后，会被 iptables 通过 tproxy 方式转发到 ztunnel 的 15001 端口上:

```bash
$ kubectl -n istio-system exec -it ztunnel-27nxh -- iptables-save | grep pistioout
-A PREROUTING -i pistioout -p tcp -j TPROXY --on-port 15001 --on-ip 127.0.0.1 --tproxy-mark 0x400/0xfff
```

### ztunnel 接收与转发流量实现原理

ztunnel 使用 envoy 实现，导出 xds:

```bash
kubectl -n istio-system exec -it ztunnel-gm66l -- curl '127.0.0.1:15000/config_dump?include_eds' > dump.json
```

下面分析下处理拦截到的出方向流量的 xds 配置规则。

LDS 中监听 15001 端口，用于处理 tproxy 方式拦截到的用户 Pod 出方向流量(`"trasparent": true` 指示 envoy 监听时使用 `IP_TRANSPARENT` socket 选项以便让目的 IP 不是 ztunnel 网卡 IP 的数据包也能让 ztunnel 收到，实现 tproxy 透明代理) ，非 tproxy 拦截的流量就直接丢弃:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221010102951.png)

15001 端口监听有很多 `filter_chains`，具体用哪个 filter，由 `filter_chain_matcher` 来匹配:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221010111444.png)

* `SourceIPInput` 匹配源 IP，看来自节点上哪个 Pod IP。
* `DestinationIPInput` 匹配目标 IP。
* 匹配到某个 Service 的 ClusterIP，继续用 `DestinationPortInput` 匹配 Service 端口。
* 匹配完成后，action 指示要使用的 `filter` 名称。

找到对应的 filter，指示转发给指定的 Cluster:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221010112543.png)

在 CDS 中找到对应的 Cluster:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221010113142.png)

在 EDS 中找 Cluster 对应的 endpoint:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221010145339.png)

> 这里应该是 envoy dump xds 的 bug，EDS 中没展示 `cluster_name` 这个必选字段，可能是由于 HBONE 比较新，dump 的逻辑还不完善。

- endpoint 的 address 是 `envoy_internal_address` (internal_listener)。
- `filter_metadata` 中的 `tunnel.destination` 是关键，表示给这个 endpoint 带上了要访问的实际目标IP+目标端口，后面会将其传给 HBONE 隧道。

在 LDS 中找到对应的 `server_listener_name`:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221010144958.png)

- 该 listener 有 `tunneling_config`，即使用 `HBONE` 隧道方式，其中 `hostname` 为应用需要访问的实际目标IP和目标端口，引用 endpoint 中的 metadata `tunnel.destination`。
- cluster 指定转发到哪个 Cluster。

再去 CDS 中找到对应的 Cluster:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221010185533.png)

- 目标地址已经被前面的 EDS 修改成了 Service 对应的 POD IP 和 POD 端口了，CDS 的 type 为 `ORIGINAL_DST`，`upstream_port_override` 强制将目的端口改为 15008，表示使用 `POD_IP:15008` 这个地址作为报文的目标地址，也就是 HBONE 隧道上游 server 端地址。
- `tls_certificates_sds_secret_configs` 中指定连接上游要使用的证书，指定为目标 Pod 所使用的 service account 对应的证书，这也是在 L4 实现零信任网络的关键。

## 入方向流量分析

### 流量拦截原理

流量路径:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221009140413.png)

由前面出方向流量路径的分析可以得知，ztuunel 最终转发出来的目的IP和目的端口分别是目标 POD IP和固定的 15008 端口。

看下策略路由:

```bash
$ ip rule list
103:	from all lookup 100
32766:	from all lookup main
```

有个 100 号的路由表，优先级比默认的 main 表高。看下路由规则：

```bash
$ ip route show table 100
10.244.1.3 dev vethf18f80e0 scope link
10.244.1.4 via 192.168.126.2 dev istioin src 10.244.1.1
10.244.1.5 via 192.168.126.2 dev istioin src 10.244.1.1
```

可以看出会给本机上所有的网格内的 POD IP 都加一条路由规则，让到网格内 POD 的流量都走 `istioin` 这个网卡进行路由，网关是 `192.168.126.2`。

```bash
$ ip -d a s istioin
4: istioin: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default
    link/ether 3a:e0:ed:06:15:8c brd ff:ff:ff:ff:ff:ff promiscuity 0 minmtu 68 maxmtu 65485
    geneve id 1000 remote 10.244.1.3 ttl auto dstport 6081 noudpcsum udp6zerocsumrx numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535
    inet 192.168.126.1/30 brd 192.168.126.3 scope global istioin
       valid_lft forever preferred_lft forever
```

与前面出向流量走的 `istioout` 网卡类似，入向流量走的 `istioin` 网卡也是 geneve tunnel 设备，remote 是 `10.244.1.3`，即 ztunnel 的 POD IP，而网关 `192.168.126.2` 也正是 ztunnel 内的 `pistioin` 网卡:

```bash
$ kubectl -n istio-system exec -it ztunnel-27nxh -- ip -d a s pistioin
3: pistioin: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default qlen 1000
    link/ether 7e:bb:b7:60:f3:f6 brd ff:ff:ff:ff:ff:ff promiscuity 0 minmtu 68 maxmtu 65485
    geneve id 1000 remote 10.244.1.1 ttl auto dstport 6081 noudpcsum udp6zerocsumrx numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535
    inet 192.168.126.2/30 scope global pistioin
       valid_lft forever preferred_lft forever
    inet6 fe80::7cbb:b7ff:fe60:f3f6/64 scope link
       valid_lft forever preferred_lft forever
```

也就是说，发送到节点上网格内的 POD 的流量，会被自动转到 ztunnel 内的 `pistioin` 网卡。

看 ztunnel 内的 iptables 规则，会将 `pistioin` 上目的端口为 15008 的 TCP 流量，通过 tproxy 方式拦截并转发给 ztunnel 监听的 15008 端口。

```bash
$ kubectl -n istio-system exec -it ztunnel-27nxh -- iptables-save | grep pistioin
-A PREROUTING -i pistioin -p tcp -m tcp --dport 15008 -j TPROXY --on-port 15008 --on-ip 127.0.0.1 --tproxy-mark 0x400/0xfff
```

## ztunnel 接收与转发流量实现原理

查看 LDS 中 15008 端口的 Listener:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221011193021.png)

- `filter_chains` 中有很多 filter，每个 filter 对应匹配本节点上，网格内的 POD IP。
- 在 filter 的 route 中，将数据包路由到 `virtual_inbound` 这个 Cluster。

在 CDS 中找到 `virtual_inbound` 这个 Cluster:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20221011200422.png)

- `use_http_header` 表示将 downstream ztunnel 通过 HBONE CONNECT 传来的最原始的目标 POD IP 和目标端口替换成当前报文的目标IP和目标端口 (主要是为了替换 15008 端口为原始目标端口，目标 IP 本身都是目标 POD IP)。

最后，报文将只修改目的端口，其余均保持不变，再次被 envoy 转发出去，通过 veth pair 到达节点 root ns 的 vethxxx 网卡，由于目的端口不再是