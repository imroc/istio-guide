# 注入 sidecar 后 grpc 请求不响应 status code

## 问题描述

* 环境信息: 多集群下，子集群中 nginx 为 grpc 服务做了一层反向代理。
* 访问链路：grpc client --> nginx --> grpc server。
* 链路说明: grpc client 对 nginx 发起 grpc 调用，nginx 将请求 proxy_pass 到集群内的 grpc server 的 k8s service。
* 现象: 当 nginx 注入了 istio sidecar 后，grpc client 就收不到 grpc server 响应的 `grpc-status` 的 trailer 了 (即没有 grpc status code)。

## 原因

测试在 istio 1.6.9 中存在一个 bug，在多集群下，子集群中 envoy sidecar 内部的 http route 中的 domain 中的 vip 采用的是主集群中的 Cluster IP，而不是子集群中该服务对应的 Cluster IP。 如下面 nginx pod 中 envoy proxy 的路由配置：

```json
{
  "name": "location-svr.default.svc.cluster.local:50222",
  "domains": [
  "location-svr.default.svc.cluster.local",
  "location-svr.default.svc.cluster.local:50222",
  "location-svr",
  "location-svr:50222",
  "location-svr.default.svc.cluster",
  "location-svr.default.svc.cluster:50222",
  "location-svr.default.svc",
  "location-svr.default.svc:50222",
  "location-svr.default",
  "location-svr.default:50222",
  "172.21.255.24",              # 此处的 VIP 是主机群中的 cluster ip，而不是子集群中的 cluster ip
  "172.21.255.24:50222"
],
"routes": [
  ...
```

* grpc client 发起请求时带上的 host 是 nginx 的域名地址，被 nginx proxy_pass 时带上了，但 envoy 是匹配不到这个原始 host 的，就尝试去匹配报文目的 IP (即 cluster ip)。
* 但因为上述 bug，cluster ip 也匹配不到 (istio 1.6.9 子集群中 http route 只有主集群同名 service 的 cluster ip，这里目的 IP 可能只能是子集群自己的 cluster ip)，就只有 paasthrough 了。
* 由于 passthrough cluster 并不确认后端的 upstream 支持 http2，因此未设置 `http2_protocol_options` 选项。
* 该 grpc/http2 请求被 enovy 采用 http1.1 发送到 location-svr，导致未能收到 trailer (grpc status code)。

## 解决方案

有以下三种解决方案:
1. 经验证 1.8 中该 bug 已经处理，升级到 1.8 可以解决该问题。
2. nginx proxy_pass 显示指定 proxy_set_header，使用 service 名称作为 Host。
3. grpc client 请求时显示设置 Host Header 为 grpc server 的 service 名称。