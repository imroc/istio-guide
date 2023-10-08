# accesslog 相关

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';

## 部分 workload 启用 accesslog

可以用 EnvoyFilter 给部分需要的 workload 动态启用 accesslog (还可自定义日志格式)：

<Tabs>
<TabItem value="json" label="json 格式">

import EnableAccessLogJsonFormatSource from '!!raw-loader!./enable-accesslog-json-format.yaml';

<CodeBlock language="yaml" showLineNumbers title="enable-accesslog-json-format.yaml">
{EnableAccessLogJsonFormatSource}
</CodeBlock>

</TabItem>
<TabItem value="text" label="TEXT 格式">

import EnableAccessLogTextFormatSource from '!!raw-loader!./enable-accesslog-text-format.yaml';

<CodeBlock language="yaml" showLineNumbers title="enable-accesslog-text-format.yaml">
{EnableAccessLogTextFormatSource}
</CodeBlock>

</TabItem>

</Tabs>

## accesslog 打印 header 和 body

在排障的时候，如果希望将请求头、请求体、响应头或响应体打印出来进行调试，这时候可通过 EnvoyFilter 动态来启用：

<Tabs>
<TabItem value="all-header-body" label="打印所有 header 和 body">

<Tabs>
<TabItem value="all-header-body-yaml" label="EnvoyFilter">

import AccessLogPrintHeaderBody from '!!raw-loader!./enable-accesslog-text-format.yaml';

<CodeBlock language="yaml" showLineNumbers title="enable-accesslog-text-format.yaml">
{AccessLogPrintHeaderBody}
</CodeBlock>

</TabItem>

<TabItem value="all-header-body-print" label="打印效果">

import AllHeaderBodyPrintSource from '!!raw-loader!./all-header-body-print.json';

<CodeBlock language="json" showLineNumbers>
{AllHeaderBodyPrintSource}
</CodeBlock>
</TabItem>

</Tabs>

</TabItem>

<TabItem value="only-header" label="只打印 header">
<Tabs>
<TabItem value="only-header-yaml" label="EnvoyFilter">

import AccessLogPrintHeaderSource from '!!raw-loader!./accesslog-print-header.yaml';

<CodeBlock language="yaml" showLineNumbers title="accesslog-print-header.yaml">
{AccessLogPrintHeaderSource}
</CodeBlock>

</TabItem>

<TabItem value="only-header-print" label="打印效果">

import OnlyHeaderPrintSrouce from '!!raw-loader!./only-header-print.json';

<CodeBlock language="json" showLineNumbers>
{OnlyHeaderPrintSrouce}
</CodeBlock>

</TabItem>

</Tabs>
</TabItem>

<TabItem value="only-body" label="只打印 body">

<Tabs>
<TabItem value="only-body-yaml" label="EnvoyFilter">

import AccessLogPrintBodySource from '!!raw-loader!./accesslog-print-body.yaml';

<CodeBlock language="yaml" showLineNumbers title="accesslog-print-body.yaml">
{AccessLogPrintBodySource}
</CodeBlock>

</TabItem>

<TabItem value="only-body-print" label="打印效果">

import OnlyBodyPrintSrouce from '!!raw-loader!./only-body-print.json';

<CodeBlock language="json" showLineNumbers>
{OnlyBodyPrintSrouce}
</CodeBlock>

</TabItem>

</Tabs>

</TabItem>

<TabItem value="request" label="打印请求 header 和 body">

<Tabs>
<TabItem value="request-yaml" label="EnvoyFilter">

```yaml showLineNumbers title="accesslog-print-request-header-body.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: accesslog-print-request-header-body
  # highlight-next-line
  namespace: test # 只为 test 命名空间开启 accesslog，若改为 istio-system 表示作用于所有命名空间
spec:
  # highlight-start
  workloadSelector: # 通常打印 header 和 body 用于调试，可指定改配置只作用于指定 workload，避免影响其它不需要调试的 workload 的性能
    labels:
      app: nginx
  # highlight-end
  configPatches:
    - applyTo: NETWORK_FILTER
      match:
        listener:
          filterChain:
            filter:
              name: "envoy.filters.network.http_connection_manager"
      patch:
        operation: MERGE
        value:
          typed_config:
            "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager"
            access_log:
              - name: envoy.access_loggers.file
                typed_config:
                  "@type": "type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog"
                  path: /dev/stdout
                  log_format:
                    json_format:
                      start_time: "%START_TIME%"
                      route_name: "%ROUTE_NAME%"
                      method: "%REQ(:METHOD)%"
                      path: "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%"
                      protocol: "%PROTOCOL%"
                      response_code: "%RESPONSE_CODE%"
                      response_flags: "%RESPONSE_FLAGS%"
                      response_code_details: "%RESPONSE_CODE_DETAILS%"
                      connection_termination_details: "%CONNECTION_TERMINATION_DETAILS%"
                      bytes_received: "%BYTES_RECEIVED%"
                      bytes_sent: "%BYTES_SENT%"
                      duration: "%DURATION%"
                      upstream_service_time: "%RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)%"
                      x_forwarded_for: "%REQ(X-FORWARDED-FOR)%"
                      user_agent: "%REQ(USER-AGENT)%"
                      request_id: "%REQ(X-REQUEST-ID)%"
                      authority: "%REQ(:AUTHORITY)%"
                      upstream_host: "%UPSTREAM_HOST%"
                      upstream_cluster: "%UPSTREAM_CLUSTER%"
                      upstream_local_address: "%UPSTREAM_LOCAL_ADDRESS%"
                      downstream_local_address: "%DOWNSTREAM_LOCAL_ADDRESS%"
                      downstream_remote_address: "%DOWNSTREAM_REMOTE_ADDRESS%"
                      requested_server_name: "%REQUESTED_SERVER_NAME%"
                      upstream_transport_failure_reason: "%UPSTREAM_TRANSPORT_FAILURE_REASON%"
                      # highlight-start
                      request_headers: "%DYNAMIC_METADATA(envoy.lua:request_headers)%"
                      request_body: "%DYNAMIC_METADATA(envoy.lua:request_body)%"
                      # highlight-end
    - applyTo: HTTP_FILTER
      match:
        context: ANY
        listener:
          filterChain:
            filter:
              name: "envoy.filters.network.http_connection_manager"
              subFilter:
                name: "envoy.filters.http.router"
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.lua
          typed_config:
            "@type": "type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua"
            # highlight-start
            inlineCode: |
              function envoy_on_request(request_handle)
                local headers = request_handle:headers()
                local headers_map = {}
                for key, value in pairs(headers) do
                  headers_map[key] = value
                end
                request_handle:streamInfo():dynamicMetadata():set("envoy.lua", "request_headers", headers_map)
                local request_body_buffer = request_handle:body()
                if(request_body_buffer == nil)
                then
                  request_handle:streamInfo():dynamicMetadata():set("envoy.lua", "request_body", "-")
                else
                  local request_body_data = request_body_buffer:getBytes(0, request_body_buffer:length())
                  request_handle:streamInfo():dynamicMetadata():set("envoy.lua", "request_body", request_body_data)
                end
              end
            # highlight-end
```
</TabItem>

<TabItem value="request-print" label="打印效果">

```json showLineNumbers
{
  "authority": "nginx.test.svc.cluster.local",
  "response_code": 404,
  "method": "GET",
  "upstream_service_time": "1",
  "user_agent": "curl/7.85.0",
  "bytes_received": 0,
  "start_time": "2023-10-08T06:19:16.705Z",
  "downstream_local_address": "172.16.244.170:80",
  "route_name": "default",
  "duration": 1,
  "response_code_details": "via_upstream",
  "upstream_host": "172.16.0.236:80",
  "upstream_cluster": "outbound|80||nignx.test.svc.cluster.local",
  "upstream_transport_failure_reason": null,
  "x_forwarded_for": null,
  "request_id": "19c42034-0f03-4195-ab33-d4a558ca1de4",
  "upstream_local_address": "172.16.0.237:35624",
  "requested_server_name": null,
  // highlight-next-line
  "request_body": "hello",
  "protocol": "HTTP/1.1",
  "connection_termination_details": null,
  "bytes_sent": 10480,
  "path": "/test",
  "downstream_remote_address": "172.16.0.237:44838",
  // highlight-start
  "request_headers": {
    "x-envoy-peer-metadata": "ChsKDkFQUF9DT05UQUlORVJTEgkaB3Rvb2xib3gKGgoKQ0xVU1RFUl9JRBIMGgpLdWJlcm5ldGVzCh4KDElOU1RBTkNFX0lQUxIOGgwxNzIuMTYuMC4yMzcKGQoNSVNUSU9fVkVSU0lPThIIGgYxLjE4LjMKywEKBkxBQkVMUxLAASq9AQoQCgNhcHASCRoHdG9vbGJveAokChpuZXR3b3JraW5nLmlzdGlvLmlvL3R1bm5lbBIGGgRodHRwCiQKGXNlY3VyaXR5LmlzdGlvLmlvL3Rsc01vZGUSBxoFaXN0aW8KLAofc2VydmljZS5pc3Rpby5pby9jYW5vbmljYWwtbmFtZRIJGgd0b29sYm94Ci8KI3NlcnZpY2UuaXN0aW8uaW8vY2Fub25pY2FsLXJldmlzaW9uEggaBmxhdGVzdAoaCgdNRVNIX0lEEg8aDWNsdXN0ZXIubG9jYWwKIgoETkFNRRIaGhh0b29sYm94LTY5ODk1OWY1YzctdGJoZmcKGAoJTkFNRVNQQUNFEgsaCW1lc2gtdGVzdApNCgVPV05FUhJEGkJrdWJlcm5ldGVzOi8vYXBpcy9hcHBzL3YxL25hbWVzcGFjZXMvbWVzaC10ZXN0L2RlcGxveW1lbnRzL3Rvb2xib3gKFwoRUExBVEZPUk1fTUVUQURBVEESAioAChoKDVdPUktMT0FEX05BTUUSCRoHdG9vbGJveA==",
    "x-envoy-decorator-operation": "nginx.test.svc.cluster.local:80/*",
    ":scheme": "http",
    "user-agent": "curl/7.85.0",
    "x-request-id": "19c42034-0f03-4195-ab33-d4a558ca1de4",
    ":method": "GET",
    "x-envoy-peer-metadata-id": "sidecar~172.16.0.237~toolbox-698959f5c7-tbhfg.test~test.svc.cluster.local",
    "accept": "*/*",
    ":authority": "nginx.test.svc.cluster.local",
    "x-forwarded-proto": "http",
    ":path": "/test"
  },
  // highlight-end
  "response_flags": "-"
}
```
</TabItem>

</Tabs>

</TabItem>

<TabItem value="response" label="打印响应 header 和 body">

<Tabs>
<TabItem value="response-yaml" label="EnvoyFilter">

```yaml showLineNumbers title="accesslog-print-response-header-body.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: accesslog-print-response-header-body
  # highlight-next-line
  namespace: test # 只为 test 命名空间开启 accesslog，若改为 istio-system 表示作用于所有命名空间
spec:
  # highlight-start
  workloadSelector: # 通常打印 header 和 body 用于调试，可指定改配置只作用于指定 workload，避免影响其它不需要调试的 workload 的性能
    labels:
      app: nginx
  # highlight-end
  configPatches:
    - applyTo: NETWORK_FILTER
      match:
        listener:
          filterChain:
            filter:
              name: "envoy.filters.network.http_connection_manager"
      patch:
        operation: MERGE
        value:
          typed_config:
            "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager"
            access_log:
              - name: envoy.access_loggers.file
                typed_config:
                  "@type": "type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog"
                  path: /dev/stdout
                  log_format:
                    json_format:
                      start_time: "%START_TIME%"
                      route_name: "%ROUTE_NAME%"
                      method: "%REQ(:METHOD)%"
                      path: "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%"
                      protocol: "%PROTOCOL%"
                      response_code: "%RESPONSE_CODE%"
                      response_flags: "%RESPONSE_FLAGS%"
                      response_code_details: "%RESPONSE_CODE_DETAILS%"
                      connection_termination_details: "%CONNECTION_TERMINATION_DETAILS%"
                      bytes_received: "%BYTES_RECEIVED%"
                      bytes_sent: "%BYTES_SENT%"
                      duration: "%DURATION%"
                      upstream_service_time: "%RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)%"
                      x_forwarded_for: "%REQ(X-FORWARDED-FOR)%"
                      user_agent: "%REQ(USER-AGENT)%"
                      request_id: "%REQ(X-REQUEST-ID)%"
                      authority: "%REQ(:AUTHORITY)%"
                      upstream_host: "%UPSTREAM_HOST%"
                      upstream_cluster: "%UPSTREAM_CLUSTER%"
                      upstream_local_address: "%UPSTREAM_LOCAL_ADDRESS%"
                      downstream_local_address: "%DOWNSTREAM_LOCAL_ADDRESS%"
                      downstream_remote_address: "%DOWNSTREAM_REMOTE_ADDRESS%"
                      requested_server_name: "%REQUESTED_SERVER_NAME%"
                      upstream_transport_failure_reason: "%UPSTREAM_TRANSPORT_FAILURE_REASON%"
                      # highlight-start
                      response_headers: "%DYNAMIC_METADATA(envoy.lua:response_headers)%"
                      response_body: "%DYNAMIC_METADATA(envoy.lua:response_body)%"
                      # highlight-end
    - applyTo: HTTP_FILTER
      match:
        context: ANY
        listener:
          filterChain:
            filter:
              name: "envoy.filters.network.http_connection_manager"
              subFilter:
                name: "envoy.filters.http.router"
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.lua
          typed_config:
            "@type": "type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua"
            # highlight-start
            inlineCode: |
              function envoy_on_response(response_handle)
                local headers = response_handle:headers()
                local headers_map = {}
                for key, value in pairs(headers) do
                  headers_map[key] = value
                end
                response_handle:streamInfo():dynamicMetadata():set("envoy.lua","response_headers", headers_map)
                local response_body_buffer = response_handle:body()
                if(response_body_buffer == nil)
                then
                  response_handle:streamInfo():dynamicMetadata():set("envoy.lua", "response_body", "-")
                else
                  local response_body_data = response_body_buffer:getBytes(0, response_body_buffer:length())
                  response_handle:streamInfo():dynamicMetadata():set("envoy.lua", "response_body", response_body_data)
                end
              end
            # highlight-end
```
</TabItem>

<TabItem value="response-print" label="打印效果">

```json showLineNumbers
{
  "authority": "nginx.test.svc.cluster.local",
  "response_code": 404,
  "method": "GET",
  "upstream_service_time": "1",
  "user_agent": "curl/7.85.0",
  "bytes_received": 0,
  "start_time": "2023-10-08T06:19:16.705Z",
  "downstream_local_address": "172.16.244.170:80",
  "route_name": "default",
  "duration": 1,
  "response_code_details": "via_upstream",
  "upstream_host": "172.16.0.236:80",
  "upstream_cluster": "outbound|80||nignx.test.svc.cluster.local",
  "upstream_transport_failure_reason": null,
  "x_forwarded_for": null,
  "request_id": "19c42034-0f03-4195-ab33-d4a558ca1de4",
  // highlight-start
  "response_headers": {
    "date": "Sun, 08 Oct 2023 06:19:16 GMT",
    "server": "nginx/1.23.4",
    "content-length": "10480",
    "x-envoy-upstream-service-time": "1",
    ":status": "404",
    "content-type": "text/html",
    "etag": "\"65224347-28f0\"",
    "connection": "keep-alive"
  },
  // highlight-end
  "upstream_local_address": "172.16.0.237:35624",
  "requested_server_name": null,
  "protocol": "HTTP/1.1",
  // highlight-next-line
  "response_body": "world",
  "connection_termination_details": null,
  "bytes_sent": 10480,
  "path": "/test",
  "downstream_remote_address": "172.16.0.237:44838",
  "response_flags": "-"
}
```
</TabItem>

</Tabs>

</TabItem>

</Tabs>

## 参考资料

* [Envoy Access Log 变量参考](https://www.envoyproxy.io/docs/envoy/latest/configuration/observability/access_log/usage#command-operators)
* [Istio Default Access Log Format](https://istio.io/latest/docs/tasks/observability/logs/access-log/#default-access-log-format)
