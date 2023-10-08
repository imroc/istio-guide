# 启用 gzip 压缩

## 背景

istio 的 ingressgateway 默认没启用 gzip 压缩，相比之下，消耗的流量比较大，如果流量走的公网就比较烧钱，可以利用 EnvoyFilter 来为 ingressgateway 启用 gzip 压缩，节约带宽成本。

## EnvoyFilter

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="enable-all" label="所有 ingressgateway 统一开启 gzip">

```yaml showLineNumbers title="enable-gzip.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: enable-gzip
  # highlight-next-line
  namespace: istio-system # istio-system 表示针对所有命名空间生效
spec:
  # highlight-start
  workloadSelector: # 选中所有 ingressgateway
    labels:
      istio: ingressgateway # 所有 ingressgateway 都带此 label
  # highlight-end
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: GATEWAY
      listener:
        filterChain:
          filter:
            name: envoy.filters.network.http_connection_manager
            subFilter:
              name: envoy.filters.http.router
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.compressor
        typed_config:
          '@type': type.googleapis.com/envoy.extensions.filters.http.compressor.v3.Compressor
          compressor_library:
            name: text_optimized
            typed_config:
              '@type': type.googleapis.com/envoy.extensions.compression.gzip.compressor.v3.Gzip
              compression_level: BEST_COMPRESSION
              compression_strategy: DEFAULT_STRATEGY
              memory_level: 9
              window_bits: 15
          remove_accept_encoding_header: true
          response_direction_config:
            common_config:
              content_type:
              - application/javascript
              - application/json
              - application/xhtml+xml
              - image/svg+xml
              - text/css
              - text/html
              - text/plain
              - text/xml
              min_content_length: 100
```
</TabItem>

<TabItem value="enable-one" label="为指定的 ingressgateway 开启 gzip">

```yaml showLineNumbers title="enable-gzip-for-public.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: enable-gzip-for-public
  # highlight-next-line
  namespace: prod # 限制在 ingressgateway 所在命名空间
spec:
  # highlight-start
  workloadSelector: # 限制指定 ingressgateway
    labels:
      app: istio-ingressgateway-public
  # highlight-end
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: GATEWAY
      listener:
        filterChain:
          filter:
            name: envoy.filters.network.http_connection_manager
            subFilter:
              name: envoy.filters.http.router
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.compressor
        typed_config:
          '@type': type.googleapis.com/envoy.extensions.filters.http.compressor.v3.Compressor
          compressor_library:
            name: text_optimized
            typed_config:
              '@type': type.googleapis.com/envoy.extensions.compression.gzip.compressor.v3.Gzip
              compression_level: BEST_COMPRESSION
              compression_strategy: DEFAULT_STRATEGY
              memory_level: 9
              window_bits: 15
          remove_accept_encoding_header: true
          response_direction_config:
            common_config:
              content_type:
              - application/javascript
              - application/json
              - application/xhtml+xml
              - image/svg+xml
              - text/css
              - text/html
              - text/plain
              - text/xml
              min_content_length: 100
```
</TabItem>
</Tabs>

