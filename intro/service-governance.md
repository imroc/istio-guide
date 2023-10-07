# 服务治理的几种方式与对比

## 治理逻辑与业务逻辑耦合

在分布式服务早期，微服务之间的调用是通过硬编码对端服务地址直接调用来实现的：

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F10%2F07%2F20231007162606.png)

如果有多个地址，调用端往往还得自己编写负载均衡算法、接口路由策略等治理逻辑，扩展性很差，变更起来简直就是一场灾难。

## 治理逻辑下沉到 SDK

因为治理逻辑与业务逻辑耦合的缺点，诞生了微服务框架，比如 Dubbo 和 Sprint Cloud，将治理逻辑从业务逻辑中剥离，下沉到 SDK 类库中：

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F10%2F07%2F20231007163426.png)

## 治理逻辑独立到应用进程之外

### 微服务框架的弊端

虽然治理逻辑下沉到 SDK 后，避免了与业务逻辑耦合，使得微服务的开发变得更加容易，但也存在一些问题：

1. 升级麻烦。虽然治理逻辑下沉到 SDK，但是 SDK 仍然需要与业务代码一起打包发布，这就导致了 SDK 与业务代码的版本耦合，SDK 升级后，业务代码也需要跟着升级，这就增加了升级的成本。
2. 更新配置麻烦。虽然治理逻辑与业务逻辑解耦，但仍需在业务代码中引用 SDK 及其配置，无法实现治理逻辑的动态更新，只能通过重启应用来实现治理逻辑的更新，这就导致了治理逻辑的变更非常困难。
3. 存在跨语言问题。通常微服务框架只针对特定编程语言，也就限制了微服务使用的开发语言。
4. 学习成本高。微服务框架通常都是一个大而全的框架，学习成本很高。

### 服务网格 Sidecar 模式

为了解决上述问题，服务网格又诞生了，典型模式是 Sidecar 模式:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F10%2F07%2F20231007165229.png)

在 Kubernetes 环境中，Sidecar 会注入到业务 Pod 中，业务流量被 Sidecar 拦截，然后 Sidecar 解析协议内容并根据服务网格的配置进行转发：

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F10%2F07%2F20231007165959.png)

配置是服务网格控制面动态下发给 Sidecar 的，可实时动态更新，无需重启业务：

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F10%2F07%2F20231007170053.png)

Sidecar 也与业务进程互相独立，没有耦合，且与开发语言无关。

目前主流的服务网格有 Istio、Linkerd、Consul、Cilium、Kuma 等，其中使用最为广泛的是 Istio，它使用 Envoy 作为 Sidecar (数据面)。

### 服务网格 Sidecarless 模式

近期，Istio 还推出了 ambient 模式，即不再使用 sidecar，而是用 daemonset 部署 ztunnel 组件作为节点级别的代理，由 ztunnel 拦截本节点上所有网格内的 Pod 的流量，由 ztunnel 来进行四层转发：

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F10%2F07%2F20231007171829.png)

如果目的服务使用了七层协议特性，会单独走一跳 waypoint proxy 进行七层转发：

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F10%2F07%2F20231007171714.png)

这种架构带来了以下好处：

1. 减少了资源占用。Sidecar 模式需要为每个 Pod 都注入 Sidecar，每个 Sidecar 都要从控制面接收大量配置，随着网格规模的增加，资源占用会越来越大，而 ztunnel 所需的配置很少，而且每个节点只需要一个 ztunnel 实例，且 ztunnel 只做四层转发，极大的降低了资源占用。
2. 某些场景下降低时延。如果没用到七层能力，ztunnel 直接就四层转发，不需要解析七层；如果用到七层能力，也只需要在 waypoint proxy 做一次七层解析，不像 sidecar 那样需要两次解析，从而降低时延。
3. 提高安全性。ztunnel 与业务容器不在同一个 Pod，业务被侵入后的爆炸半径可控。
