# 限流

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import FileBlock from '@site/src/components/FileBlock'

## 本地限流

首先在要给 pod 加注解配置让 Envoy 启用 `http_local_rate_limit` 的统计数据 ，示例(注意高亮部分)：

<FileBlock showLineNumbers file="envoyfilter/rate-limit/productpage-enable-http-local-rate-limit-proxy-config.yaml" />

然后根据限流需求创建 EnvoyFilter，示例：

<Tabs>
  <TabItem value="ratelimit-workload" label="限制某个 workload 的 QPS">
    <FileBlock showLineNumbers showFileName file="envoyfilter/rate-limit/local-ratelimit-workload.yaml" />
  </TabItem>

  <TabItem value="ratelimit-port" label="限制某个 workload 的某个端口的 QPS">
    <FileBlock showLineNumbers showFileName file="envoyfilter/rate-limit/local-ratelimit-port.yaml" />
  </TabItem>
</Tabs>


## 参考资料

* [使用 Envoy 启用速率限制](https://istio.io/latest/zh/docs/tasks/policy-enforcement/rate-limit/)
