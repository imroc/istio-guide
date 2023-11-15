# 响应 x-request-id

## 背景

有时希望在响应头中返回请求头中的 `x-request-id`，以便于跟踪请求，这时我们可以利用 EnvoyFilter 来实现。

## EnvoyFilter

<FileBlock showLineNumbers showFileName file="envoyfilter/response-request-id.yaml" />

## 效果

```bash showLineNumbers
$ curl -I https://imroc.cc/istio
HTTP/2 200 
server: istio-envoy
date: Wed, 15 Nov 2023 03:39:31 GMT
content-type: text/html
content-length: 37698
last-modified: Sat, 14 Oct 2023 01:02:42 GMT
etag: "6529e8b2-9342"
accept-ranges: bytes
x-envoy-upstream-service-time: 5
# highlight-next-line
x-request-id: 712fd33d-5dd8-441b-aac7-0280de975a85
vary: Accept-Encoding
```
