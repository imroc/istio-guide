# 保留 header 大小写

import FileBlock from '@site/src/components/FileBlock';

## 背景

Envoy 默认会将 header 统一转换为小写，HTTP 的 RFC 规范也要求应用不能对 header 大小写敏感，所以正常情况下没什么问题。

但有些应用没有遵循 RFC 规范，对大小写敏感了，导致迁移到 istio 环境后报错。这时可以通过 EnvoyFilter 让 Envoy 保留 HTTP header 大小写。

## 请求与响应的 header 大小写都保留

<FileBlock showLineNumbers showFileName file="envoyfilter/preserve-case/preserve-case-all.yaml" />

## 只保留请求 header 的大小写

<FileBlock showLineNumbers showFileName file="envoyfilter/preserve-case/preserve-case-request.yaml" />

## 只保留响应 header 的大小写

<FileBlock showLineNumbers showFileName file="envoyfilter/preserve-case/preserve-case-response.yaml" />
