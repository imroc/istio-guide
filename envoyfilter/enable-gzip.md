# 启用 gzip 压缩

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import FileBlock from '@site/src/components/FileBlock'

## 背景

istio 的 ingressgateway 默认没启用 gzip 压缩，相比之下，消耗的流量比较大，如果流量走的公网就比较烧钱，可以利用 EnvoyFilter 来为 ingressgateway 启用 gzip 压缩，节约带宽成本。

## EnvoyFilter

<Tabs>
  <TabItem value="enable-all" label="所有 ingressgateway 统一开启 gzip">
    <FileBlock showLineNumbers showFileName file="envoyfilter/gzip/enable-gzip.yaml">
    </FileBlock>
  </TabItem>

  <TabItem value="enable-one" label="为指定的 ingressgateway 开启 gzip">
    <FileBlock showLineNumbers showFileName file="envoyfilter/gzip/enable-gzip-for-public.yaml">
    </FileBlock>
  </TabItem>
</Tabs>

