# 响应 x-request-id

## 背景

有时希望在响应头中返回请求头中的 `x-request-id`，以便于跟踪请求，这时我们可以利用 EnvoyFilter 来实现。

## EnvoyFilter

<FileBlock showLineNumbers showFileName file="envoyfilter/response-request-id.yaml" />
