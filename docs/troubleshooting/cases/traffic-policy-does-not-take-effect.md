# trafficPolicy 不生效

## 问题描述

为服务配置了 DestinationRule 和 VirtualService，且 VirtualService 绑好了 Gateway，DestinationRule 配置了 trafficPolicy，指定了熔断策略，但使用 ab 压测发现没有触发熔断 (ingressgateway 的 access_log 中 response_flags 没有 "UO")。

## 原因分析

ab 压测时发送的 HTTP/1.0 请求，而 envoy 需要至少 HTTP/1.1，固定返回 426 Upgrade Required，根本不会进行转发，所以也就不会返回 503，response_flags 也不会有。

## 解决方案

压测工具换用 wrk，默认发送 HTTP/1.1 的请求，可以正常触发熔断。