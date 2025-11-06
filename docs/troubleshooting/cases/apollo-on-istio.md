# 使用 apollo 的 java 应用启动报 404

## 问题描述

项目中使用了 apollo 插件，在非 istio 环境正常运行，但部署到 istio 后启动报类似如下错误:

```log
Sync config from upstream repository class com.ctrip.framework.apollo.internals.RemoteConfigRepository failed, reason: Load Apollo Config failed - xxx, url: http://10.5.16.49:8080/configs/agent-center/see-test-02/test.common?ip=10.5.16.46 [Cause: [status code: 404] Could not find config for xxx please check whether the configs are released in Apollo!]
```

表示请求 apollo 的 config service 返回 404 了。

## 排查 accesslog

查看 envoy 的 accesslog:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F09%2F22%2F20230922191139.png)

* `response_flags` 为 `NR`，表示找不到路由 (参考 envoy 官网解释: No route configured for a given request in addition to 404 response code, or no matching filter chain for a downstream connection)。
* 请求使用的 `Host` 直接用的 `PodIP:Port`。
* 该 `PodIP:Port` 属于 apollo 服务的 headless service 一个 endpoint (apollo 通过 statefulset 部署)。

## headless service 的 xDS 规则

进一步分析之前，我们先了解下 istio 对 headless service 的 xDS 支持:
* 下发的 `LDS` 规则中会监听 headless service 所有可能的 `PortIP:Port`，请求 headless service 的 Pod 时，这里先匹配上。
* 然后走到 `RDS` 规则进行路由，路由时会匹配 hosts，hosts 列表中列举了所有可能的 service 地址 (没有 Pod IP)，如果都匹配不到就会返回 404。

## 问题原因

由于请求 apollo 的 config service 时，`Host` 没有使用 service 地址，而是直接使用了 `PodIP:Port`，所以 `RDS` 匹配时找不到相应 hosts，就会返回 404。

## 为什么没有使用 service 地址 ?

为了实现高可用，apollo 的 java 客户端默认是从 meta server 中获取 config service 的 ip 地址 (服务发现)，然后直接对该地址发起请求 (不使用 k8s service)，从而导致请求 config service 时没有将其 k8s service 地址作为 `Host`，最后 hosts 匹配不到返回 404。

## 如果解决 ?

在 istio 场景下 (kubernetes 之上)，请求 config service 就不需要不走 apollo meta server 获取 config service 的 ip 来实现高可用，直接用 kubernetes 的 service 做服务发现就行。幸运的是，apollo 也支持跳过 meta server 服务发现，这样访问 config service 时就可以直接请求 k8s service 了，也就可以解决此问题。

具体配置方法参考 [Apollo Java 客户端使用指南](https://github.com/ctripcorp/apollo/wiki/Java%E5%AE%A2%E6%88%B7%E7%AB%AF%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97#1222-%E8%B7%B3%E8%BF%87apollo-meta-server%E6%9C%8D%E5%8A%A1%E5%8F%91%E7%8E%B0) 。
