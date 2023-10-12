# 限流

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import FileBlock from '@site/src/components/FileBlock'

## 本地限流

本地限流的意思是只针对单个代理 (ingressgateway 或 sidecar) 的速率限制，不是全局的，不过一般用本地限流就足够了，能够起到保护后端不过载的作用。

### 加注解

首先在要给 pod 加注解配置让 Envoy 启用 `http_local_rate_limit` 的统计数据 ，示例(注意高亮部分)：

<FileBlock showLineNumbers file="envoyfilter/ratelimit/productpage-enable-http-local-rate-limit-proxy-config.yaml" />

### 创建 EnvoyFilter

然后根据限流需求创建 EnvoyFilter，示例：

<Tabs>
  <TabItem value="ratelimit-workload" label="限制某个 workload 的 QPS">
    <FileBlock showLineNumbers showFileName file="envoyfilter/ratelimit/local-ratelimit-workload.yaml" />
  </TabItem>

  <TabItem value="ratelimit-port" label="限制某个 workload 的某个端口的 QPS">
    <FileBlock showLineNumbers showFileName file="envoyfilter/ratelimit/local-ratelimit-port.yaml" />
  </TabItem>
</Tabs>

## 全局限流

全局限流的意思是在全局限制 QPS，既然是全局，那必然有单独的地方存储请求的统计数据，一般使用 redis 来存储，然后限流服务根据 redis 中全局的统计数据判断是否要限流。

这个相对麻烦，可参考 [官方文档](https://istio.io/latest/zh/docs/tasks/policy-enforcement/rate-limit/#global-rate-limit)。

## 参考资料

* [使用 Envoy 启用速率限制](https://istio.io/latest/zh/docs/tasks/policy-enforcement/rate-limit/)
