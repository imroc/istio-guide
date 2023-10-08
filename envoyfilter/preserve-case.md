# 保留 header 大小写

## 背景

Envoy 默认会将 header 统一转换为小写，HTTP 的 RFC 规范也要求应用不能对 header 大小写敏感，所以正常情况下没什么问题。

但有些应用没有遵循 RFC 规范，对大小写敏感了，导致迁移到 istio 环境后报错。这时可以通过 EnvoyFilter 让 Envoy 保留 HTTP header 大小写。

## 请求与响应的 header 大小写都保留

```yaml showLineNumbers title="preserve-case-all.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: preserve-case-all
  # highlight-next-line
  namespace: test # 限制命名空间，若改为 istio-system 表示作用于所有命名空间
spec:
  # highlight-start
  workloadSelector: # 精确到指定的 workload，若不需要可去掉
    labels:
      app: istio-ingressgateway
  # highlight-end
  priority: 0
  configPatches:
    - applyTo: CLUSTER
      match:
        context: ANY
      patch:
        operation: MERGE
        value:
          typed_extension_protocol_options:
            envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
              "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
              use_downstream_protocol_config:
                http_protocol_options:
                  header_key_format:
                    stateful_formatter:
                      name: preserve_case
                      typed_config:
                        "@type": type.googleapis.com/envoy.extensions.http.header_formatters.preserve_case.v3.PreserveCaseFormatterConfig
    - applyTo: NETWORK_FILTER
      match:
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
      patch:
        operation: MERGE
        value:
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
            http_protocol_options:
              header_key_format:
                stateful_formatter:
                  name: preserve_case
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.http.header_formatters.preserve_case.v3.PreserveCaseFormatterConfig
```

## 只保留请求 header 的大小写

```yaml showLineNumbers title="preserve-case-request.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: preserve-case-request
  # highlight-next-line
  namespace: test # 限制命名空间，若改为 istio-system 表示作用于所有命名空间
spec:
  # highlight-start
  workloadSelector: # 精确到指定的 workload，若不需要可去掉
    labels:
      app: istio-ingressgateway
  # highlight-end
  priority: 0
  configPatches:
    - applyTo: NETWORK_FILTER
      match:
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
      patch:
        operation: MERGE
        value:
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
            http_protocol_options:
              header_key_format:
                stateful_formatter:
                  name: preserve_case
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.http.header_formatters.preserve_case.v3.PreserveCaseFormatterConfig
```

## 只保留响应 header 的大小写

```yaml showLineNumbers title="preserve-case-response.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: preserve-case-response
  # highlight-next-line
  namespace: test # 限制命名空间，若改为 istio-system 表示作用于所有命名空间
spec:
  # highlight-start
  workloadSelector: # 精确到指定的 workload，若不需要可去掉
    labels:
      app: istio-ingressgateway
  # highlight-end
  priority: 0
  configPatches:
    - applyTo: CLUSTER
      match:
        context: ANY
      patch:
        operation: MERGE
        value:
          typed_extension_protocol_options:
            envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
              "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
              use_downstream_protocol_config:
                http_protocol_options:
                  header_key_format:
                    stateful_formatter:
                      name: preserve_case
                      typed_config:
                        "@type": type.googleapis.com/envoy.extensions.http.header_formatters.preserve_case.v3.PreserveCaseFormatterConfig
