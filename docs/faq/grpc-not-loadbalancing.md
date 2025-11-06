# GRPC 服务负载不均

## 现象

grpc 调用，同一个 client 的请求始终只打到同一个 server 的 pod，造成负载不均。

## 分析

grpc 是基于 http2 的长连接，多次请求复用同一个连接。如果不用 istio，只用普通的 k8s service，是不会感知 grpc 协议的，只当成 tcp 来转发，在连接层面做负载均衡，不会在请求层面做负载均衡。但在 istio 中，默认会对 grpc 的请求进行请求级别的负载均衡，如果发现负载不均，通常是没有正确配置。
要让 grpc 在请求级别进行负载均衡，核心就是让 istio 正确识别是 grpc 协议，不要配置成 tcp，用 tcp 的话就只能在连接级别进行负载均衡了，请求级别可能就会负载不均。

## 解决方法

1. 如果要对外暴露，gateway 里 protocal 配置 GRPC 不用 TCP，示例:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: grpc-gw
  namespace: demo
spec:
  selector:
    app: istio-ingressgateway
    istio: ingressgateway
  servers:
  - hosts:
    - '*'
    port:
      name: grpc-demo-server
      number: 9000
      protocol: GRPC # 这里使用 GRPC 不用 TCP
```

2. 如果定义了 vs，需要使用 http 匹配而不用 tcp，因为 grpc 在 istio 中匹配也是用的 http 字段，示例:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: grpc-svc
  namespace: demo
spec:
  gateways:
  - demo/grpc-gw
  hosts:
  - '*'
  http: # 这里使用 http 不用 tcp
  - match:
    - port: 9000
    route:
    - destination:
        host: grpc.demo.svc.cluster.local
        port:
          number: 9000
      weight: 100
```

3. 部署服务的 service 的 port name 需要使用 "grpc-" 开头定义，让 istio 能够正确识别，示例:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: grpc
  namespace: demo
spec:
  ports:
  - name: grpc-9000 # 以 grpc- 开头
    port: 9000
    protocol: TCP
    targetPort: 9000
  selector:
    app: grpc
  type: ClusterIP
```

> 更多协议指定方式请参考 [istio 最佳实践: 为服务显式指定协议](../best-practices/specify-protocol.md)