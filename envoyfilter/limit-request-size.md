# 限制请求大小

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import FileBlock from '@site/src/components/FileBlock';

## 背景

Envoy 默认对请求大小有限制，包括请求头大小限制和整个请求的大小限制，分别由 [max_request_headers_kb](https://www.envoyproxy.io/docs/envoy/latest/api-v3/extensions/filters/network/http_connection_manager/v3/http_connection_manager.proto#extensions-filters-network-http-connection-manager-v3-httpconnectionmanager) 和 [max_request_bytes](https://www.envoyproxy.io/docs/envoy/latest/api-v3/extensions/filters/http/buffer/v3/buffer.proto#extensions-filters-http-buffer-v3-buffer) 这两个参数控制，以下是这两个参数的解释：

```txt
max_request_headers_kb
  (UInt32Value) The maximum request headers size for incoming connections. If unconfigured, the default max request headers allowed is 60 KiB. Requests that exceed this limit will receive a 431 response.

max_request_bytes
  (UInt32Value, REQUIRED) The maximum request size that the filter will buffer before the connection manager will stop buffering and return a 413 response.
```

简而言之：

1. 超出 `max_request_headers_kb` （请求头）的限制会响应 `431 Request Header Fields Too Large`，默认限制为 60 KiB。
2. 超出 `max_request_bytes` （请求头+请求体）的限制会响应 `413 Request Entity Too Large`，默认不限制。

有些时候需要调整下该限制：
1. 一些恶意请求的请求体过大导致 Envoy 和业务进程内存暴涨，需要限制请求体大小，防止攻击。
2. 一些特殊用途导致请求头比较大，需要上调默认的请求头限制避免响应 431。

一般只需要 ingressgateway 调整这些限制，下面给出针对 ingressgateway 调整限制的 EnvoyFilter。

## 限制请求头大小

<Tabs>
  <TabItem value="limit-header-size-all-gw" label="对所有 ingressgateway 生效">
    <FileBlock showLineNumbers showFileName file="envoyfilter/limit-request/limit-header-size.yaml">
    </FileBlock>
  </TabItem>

  <TabItem value="limit-header-size-one-gw" label="对指定 ingressgateway 生效">
    <FileBlock showLineNumbers showFileName file="envoyfilter/limit-request/limit-header-size-for-public.yaml">
    </FileBlock>
  </TabItem>
</Tabs>

## 限制请求整体大小

<Tabs>
  <TabItem value="limit-request-size-all-gw" label="对所有 ingressgateway 生效">
    <FileBlock showLineNumbers showFileName file="envoyfilter/limit-request/limit-request-size.yaml">
    </FileBlock>
  </TabItem>

  <TabItem value="limit-request-size-one-gw" label="对指定 ingressgateway 生效">
    <FileBlock showLineNumbers showFileName file="envoyfilter/limit-request/limit-request-size-for-public.yaml">
    </FileBlock>
  </TabItem>
</Tabs>

## 同时限制请求头和请求整体大小

<Tabs>
  <TabItem value="limit-size-all-gw" label="对所有 ingressgateway 生效">
    <FileBlock showLineNumbers showFileName file="envoyfilter/limit-request/limit-header-and-request-size.yaml">
    </FileBlock>
  </TabItem>

  <TabItem value="limit-size-one-gw" label="对指定 ingressgateway 生效">
    <FileBlock showLineNumbers showFileName file="envoyfilter/limit-request/limit-header-and-request-size-for-public.yaml">
    </FileBlock>
  </TabItem>
</Tabs>
