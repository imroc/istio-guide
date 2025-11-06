# 为指定 workload 动态启动 accesslog

可以用 EnvoyFilter 给部分需要的 workload 动态启用 accesslog (还可自定义日志格式)：

<Tabs>
  <TabItem value="json-format" label="json 格式">
    <FileBlock showLineNumbers showFileName file="envoyfilter/accesslog/enable-accesslog-json-format.yaml" />
  </TabItem>

  <TabItem value="text-format" label="TEXT 格式">
    <FileBlock showLineNumbers showFileName file="envoyfilter/accesslog/enable-accesslog-text-format.yaml" />
  </TabItem>
</Tabs>

