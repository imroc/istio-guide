# 状态码: 431 Request Header Fields Too Large

## 问题描述

istio 中 http 请求，envoy 返回 431 异常状态码:

``` txt
HTTP/1.1 431 Request Header Fields Too Large
```

## 原因分析

此状态码说明 http 请求 header 大小超限了，默认限制为 60 KiB，由 `HttpConnectionManager` 配置的 `max_request_headers_kb` 字段决定，最大可调整到 96 KiB:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F09%2F22%2F20230922190327.png)

## 解决方案

可以通过 EnvoyFilter 调整 `max_request_headers_kb` 字段来提升 header 大小限制。

EnvoyFilter 示例参考[这里](../usage/limit-request-size.md#%E9%99%90%E5%88%B6%E8%AF%B7%E6%B1%82%E5%A4%B4%E5%A4%A7%E5%B0%8F)。
