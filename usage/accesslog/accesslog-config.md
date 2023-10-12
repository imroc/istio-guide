# 配置 accesslog

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import FileBlock from '@site/src/components/FileBlock'

本文介绍如何配置 istio 的 accesslog。

## 全局配置方法

### 修改 ConfigMap 配置

如果 istio 已经安装好，可以修改 istio ConfigMap 配置:

```bash
kubectl -n istio-system edit configmap istio
```

编辑 yaml:

<Tabs>
  <TabItem value="json-format" label="JSON 格式">
    <FileBlock showLineNumbers file="accesslog/mesh-config-json-format.yaml" />
  </TabItem>

  <TabItem value="text-format" label="TEXT 格式">
    <FileBlock showLineNumbers file="accesslog/mesh-config-text-format.yaml" />
  </TabItem>

  <TabItem value="custom-json-format" label="自定义 JSON 格式">
    <FileBlock showLineNumbers file="accesslog/mesh-config-custom-json-format.yaml" />
  </TabItem>

  <TabItem value="custom-text-format" label="自定义 TEXT 格式">
    <FileBlock showLineNumbers file="accesslog/mesh-config-custom-text-format.yaml" />
  </TabItem>
</Tabs>


* `accessLogEncoding`: 表示 accesslog 输出格式，istio 预定义了 `TEXT` 和 `JSON` 两种日志输出格式。默认使用 `TEXT`，通常我们习惯改成 `JSON` 以提升可读性，同时也利于日志采集。
* `accessLogFile`: 表示 accesslog 输出到哪里，通常我们指定到 `/dev/stdout` (标准输出)，以便使用 `kubectl logs` 来查看日志，同时也利于日志采集。
* `accessLogFormat`: 如果不想使用 istio 预定义的 `accessLogEncoding`，我们也可以使用这个配置来自定义日志输出格式。完整的格式规则与变量列表参考 [Envoy 官方文档](https://www.envoyproxy.io/docs/envoy/latest/configuration/observability/access_log/usage) 。

### 通过 istioctl 安装时配置

如果使用 istioctl 安装的 istio，也可以用类似以下命令进行配置:

```bash
istioctl install --set profile=demo --set meshConfig.accessLogFile="/dev/stdout" --set meshConfig.accessLogEncoding="JSON"
```

## 关于日志格式

一般建议用 JSON 的单行格式，可读性高，也方便日志采集和统计分析。

### JSON 格式

istio 的 json accesslog 配置格式见 [源码](https://github.com/istio/istio/blob/1.19.3/pilot/pkg/model/telemetry_logging.go#L76C17-L102) 。转换成字符串为:

<Tabs>
  <TabItem value="multi-line" label="多行">
    <FileBlock showLineNumbers file="accesslog/json-format.json" />
  </TabItem>

  <TabItem value="single-line" label="单行">
    <FileBlock showLineNumbers file="accesslog/json-format-one-line.json" />
  </TabItem>
</Tabs>

### TEXT 格式

istio 的 text accesslog 配置格式见 [源码](https://github.com/istio/istio/blob/1.19.3/pilot/pkg/model/telemetry_logging.go#L45-L52) 。转换成字符串为:

```txt
[%START_TIME%] "%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%" %RESPONSE_CODE% %RESPONSE_FLAGS% %RESPONSE_CODE_DETAILS% %CONNECTION_TERMINATION_DETAILS% "%UPSTREAM_TRANSPORT_FAILURE_REASON%" %BYTES_RECEIVED% %BYTES_SENT% %DURATION% %RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)% "%REQ(X-FORWARDED-FOR)%" "%REQ(USER-AGENT)%" "%REQ(X-REQUEST-ID)%" "%REQ(:AUTHORITY)%" "%UPSTREAM_HOST%" %UPSTREAM_CLUSTER% %UPSTREAM_LOCAL_ADDRESS% %DOWNSTREAM_LOCAL_ADDRESS% %DOWNSTREAM_REMOTE_ADDRESS% %REQUESTED_SERVER_NAME% %ROUTE_NAME%
```


## 部分 workload 启用 accesslog

在生产环境中，有时我们不想全局启用 accesslog，我们可以利用 EnvoyFilter 来实现只为部分 namespace 或 workload 启用 accesslog，参考 [为指定 workload 动态启动 accesslog](./enable-accesslog-for-workload.md) 。


## 参考资料

* [istio 官方文档给出的常见变量的示例](https://istio.io/latest/docs/tasks/observability/logs/access-log/#default-access-log-format)
