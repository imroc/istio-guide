# 无法访问不带 sidecar 的 Pod

## 问题现象

不能从一个带 sidecar proxy 的 pod 访问到 Redis 服务。

## 问题分析

Redis是一个 Headless 服务，而 istio 1.6 之前的版本对 Headless 服务的处理有问题，会缺省启用 mTLS。

## 解决方案

在 1.6 之前可以采用DR规则禁用该服务的 mTLS 来规避:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: mysql-service
  namespace: test
spec:
  host: redis-service
  trafficPolicy:
    loadBalancer:
      simple: ROUND_ROBIN
    tls:
      mode: DISABLE
```

该问题在 isitio 1.6 中已经修复: https://github.com/istio/istio/pull/24319
