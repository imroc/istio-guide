# accesslog 相关

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 局部启用 accesslog

<Tabs>
<TabItem value="json" label="json 格式">

```yaml showLineNumbers title="enable-accesslog-json-format.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: enable-accesslog-json-format
  # highlight-next-line
  namespace: mesh-test # 只为 test 命名空间开启 accesslog，改为 istio-system 表示作用于所有命名空间
spec:
  # highlight-start
  workloadSelector: # 精确到指定的 workload，若不需要可去掉
    labels:
      app: "toolbox"
  # highlight-end
  configPatches:
    - applyTo: NETWORK_FILTER
      match:
        context: ANY
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
      patch:
        operation: MERGE
        value:
          typed_config:
            "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager"
            access_log:
              - name: envoy.access_loggers.file
                typed_config:
                  "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                  path: "/dev/stdout"
                  log_format:
                    # highlight-start
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
                    # highlight-end
```

</TabItem>
<TabItem value="text" label="TEXT 格式">

```yaml showLineNumbers title="enable-accesslog-text-format.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: enable-accesslog-text-format
  # highlight-next-line
  namespace: mesh-test # 只为 test 命名空间开启 accesslog，改为 istio-system 表示作用于所有命名空间
spec:
  # highlight-start
  workloadSelector: # 精确到指定的 workload，若不需要可去掉
    labels:
      app: "toolbox"
  # highlight-end
  configPatches:
    - applyTo: NETWORK_FILTER
      match:
        context: ANY
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
      patch:
        operation: MERGE
        value:
          typed_config:
            "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager"
            access_log:
              - name: envoy.access_loggers.file
                typed_config:
                  "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                  path: "/dev/stdout"
                  log_format:
                    # highlight-start
                    text_format: |
                      [%START_TIME%] "%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%" %RESPONSE_CODE% %RESPONSE_FLAGS% %RESPONSE_CODE_DETAILS% %CONNECTION_TERMINATION_DETAILS% "%UPSTREAM_TRANSPORT_FAILURE_REASON%" %BYTES_RECEIVED% %BYTES_SENT% %DURATION% %RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)% "%REQ(X-FORWARDED-FOR)%" "%REQ(USER-AGENT)%" "%REQ(X-REQUEST-ID)%" "%REQ(:AUTHORITY)%" "%UPSTREAM_HOST%" %UPSTREAM_CLUSTER% %UPSTREAM_LOCAL_ADDRESS% %DOWNSTREAM_LOCAL_ADDRESS% %DOWNSTREAM_REMOTE_ADDRESS% %REQUESTED_SERVER_NAME% %ROUTE_NAME%
                    # highlight-end
```
</TabItem>

</Tabs>
