# accesslog 打印 header 和 body

在排障的时候，如果希望将请求头、请求体、响应头或响应体打印出来进行调试，这时候可通过 EnvoyFilter 来针对需要调试的 workload 动态启用(不建议全局启用，会降低性能、增加内存占用)：

<Tabs>
  <TabItem value="all-header-body" label="打印所有 header 和 body">
    <Tabs>
      <TabItem value="all-header-body-yaml" label="EnvoyFilter">
        <FileBlock showLineNumbers showFileName file="envoyfilter/accesslog/accesslog-print-header-body.yaml" />
      </TabItem>
      <TabItem value="all-header-body-print" label="打印效果">
        <FileBlock showLineNumbers file="envoyfilter/accesslog/accesslog-print-header-body.jsonc" />
      </TabItem>
    </Tabs>
  </TabItem>

  <TabItem value="only-header" label="只打印 header">
    <Tabs>
      <TabItem value="only-header-yaml" label="EnvoyFilter">
        <FileBlock showLineNumbers showFileName file="envoyfilter/accesslog/accesslog-print-header.yaml" />
      </TabItem>
      <TabItem value="only-header-print" label="打印效果">
        <FileBlock showLineNumbers file="envoyfilter/accesslog/accesslog-print-header.jsonc" />
      </TabItem>
    </Tabs>
  </TabItem>

  <TabItem value="only-body" label="只打印 body">
    <Tabs>
      <TabItem value="only-body-yaml" label="EnvoyFilter">
        <FileBlock showLineNumbers showFileName file="envoyfilter/accesslog/accesslog-print-body.yaml" />
      </TabItem>
      <TabItem value="only-body-print" label="打印效果">
        <FileBlock showLineNumbers file="envoyfilter/accesslog/accesslog-print-body.jsonc" />
      </TabItem>
    </Tabs>
  </TabItem>

  <TabItem value="request" label="打印请求 header 和 body">
    <Tabs>
      <TabItem value="request-yaml" label="EnvoyFilter">
        <FileBlock showLineNumbers showFileName file="envoyfilter/accesslog/accesslog-print-request-header-body.yaml" />
      </TabItem>
      <TabItem value="request-print" label="打印效果">
        <FileBlock showLineNumbers file="envoyfilter/accesslog/accesslog-print-request-header-body.jsonc" />
      </TabItem>
    </Tabs>
  </TabItem>

  <TabItem value="response" label="打印响应 header 和 body">
    <Tabs>
      <TabItem value="response-yaml" label="EnvoyFilter">
        <FileBlock showLineNumbers showFileName file="envoyfilter/accesslog/accesslog-print-response-header-body.yaml" />
      </TabItem>
      <TabItem value="response-print" label="打印效果">
        <FileBlock showLineNumbers file="envoyfilter/accesslog/accesslog-print-response-header-body.jsonc" />
      </TabItem>
    </Tabs>
  </TabItem>
</Tabs>

## 参考资料

* [Envoy Access Log 变量参考](https://www.envoyproxy.io/docs/envoy/latest/configuration/observability/access_log/usage#command-operators)
* [Istio Default Access Log Format](https://istio.io/latest/docs/tasks/observability/logs/access-log/#default-access-log-format)
