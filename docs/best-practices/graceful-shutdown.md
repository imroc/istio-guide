# 优雅终止

## 概述

本文介绍在 istio 场景下实现优雅终止时需要重点关注的点，一些容器场景通用的关注点请参考 [Kubenretes 最佳实践: 优雅终止](https://imroc.cc/kubernetes/best-practices/graceful-shutdown/index.html) 。

## envoy 被强杀导致流量异常

当业务上了 istio 之后，流量被 sidecar 劫持，进程之间不会直接建立连接，而是经过了 sidecar 这一层代理:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F09%2F22%2F20230922191512.png)

当 Pod 开始停止时，它将从服务的 endpoints 中摘除掉，不再转发流量给它，同时 Sidecar 也会收到 `SIGTERM` 信号，立刻不再接受 inbound 新连接，但会保持存量 inbound 连接继续处理，outbound 方向流量仍然可以正常发起。

不过有个值得注意的细节，若 Pod 没有很快退出，istio 默认是会在停止开始的 5s 后强制杀死 envoy，当 envoy 进程不在了也就无法转发任何流量(不管是 inbound 还是 outbound 方向)，所以就可能存在一些问题:

1. 若被停止的服务提供的接口耗时本身较长(比如文本转语音)，存量 inbound 请求可能无法被处理完就断开了。
2. 若停止的过程需要调用其它服务(比如通知其它服务进行清理)，outbound 请求可能会调用失败。

## 启用 EXIT_ON_ZERO_ACTIVE_CONNECTIONS

自 istio 1.12 开始，Sidecar 支持了 `EXIT_ON_ZERO_ACTIVE_CONNECTIONS` 这个环境变量，作用就是等待 Sidecar “排水” 完成，在响应时，也通知客户端去关闭长连接（对于 HTTP1 响应 “Connection: close” 这个头，对于 HTTP2 响应 GOAWAY 这个帧）。

如果想要全局启用，可以修改全局配置的 configmap，在 `defaultConfig.proxyMetadata` 下加上这个环境变量:

```yaml
    defaultConfig:
      proxyMetadata:
        EXIT_ON_ZERO_ACTIVE_CONNECTIONS: "true"
```

如果想针对指定工作负载启用，可以给 Pod 加注解:

```yaml
proxy.istio.io/config: '{ "proxyMetadata": { "EXIT_ON_ZERO_ACTIVE_CONNECTIONS": "true" } }'
```

若使用的是腾讯云服务网格 TCM，可以在控制台启用：

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/20230104110821.png)
