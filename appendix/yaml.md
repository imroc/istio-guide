# 实用 YAML

## sidecar 注入相关

### 为指定 workload 取消 sidecar 自动注入

```yaml
  template:
    metadata:
      annotations:
        sidecar.istio.io/inject: "false"
```

## proxy 相关

### 自定义 request/limit

```yaml
  template:
    metadata:
      annotations:
        "sidecar.istio.io/proxyCPU": "10m"
        "sidecar.istio.io/proxyCPULimit": "2"
        "sidecar.istio.io/proxyMemory": "32Mi"
        "sidecar.istio.io/proxyMemoryLimit": "1Gi"
```

### 自定义日志级别

```yaml
  template:
    metadata:
      annotations:
        "sidecar.istio.io/logLevel": debug # 可选: trace, debug, info, warning, error, critical, off
        "sidecar.istio.io/componentLogLevel": "ext_authz:trace,filter:debug"
```
* [envoy component logging 说明](https://www.envoyproxy.io/docs/envoy/latest/operations/cli#cmdoption-component-log-level)

### 不劫持部分外部地址的流量以提升性能(比如外部数据库)

```yaml
  template:
    metadata:
      annotations:
        traffic.sidecar.istio.io/excludeOutboundIPRanges: "10.10.31.1/32,10.10.31.2/32"
```

## mtls 配置

### 全局禁用 mtls

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: DISABLE
```

## DestinationRule 相关

### 为某个服务启用地域感知

地域感知行为需要显式指定 `outlierDetection` 后才会启用:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: nginx
spec:
  host: nginx
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 30s
      baseEjectionTime: 30s
```