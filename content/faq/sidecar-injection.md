# Sidecar 注入相关问题

## 可以只在一端注入 sidecar 吗？

* Q: 只在客户端和服务端其中一方注入 sidecar，是否能够正常工作呢？
* A: 一般是建议都注入。有些功能在 outbound 和 inbound 端都需要，有些只在其中一端需要，下面一张图可以一目了然:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F09%2F22%2F20230922191345.png)

