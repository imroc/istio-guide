# 最新进展

## 当前阶段

当前处于试验阶段，预计2022年底或2023年初 beta。

## 代码分支

当前 ambient 模式的代码还没有合入主干，在 [experimental-ambient](https://github.com/istio/istio/tree/experimental-ambient) 分支。[这个 issue](https://github.com/istio/istio/issues/40879) 在跟进合入 master 之前需要完成的重要事项。

## 已知问题

### 环境适配问题

当前还处于早期阶段，很多环境都不支持，比如 mac m1 电脑上使用 kind 创建的集群、使用了网桥的网络模式的集群、某些使用策略路由实现的容器网络等等。

### ztunnel 问题

当前 ztunnel 使用 envoy 实现，存在一些列问题，社区也在考虑替代方案，改进或者用 Rust 写一个，详见 [这个 issue](https://github.com/istio/istio/issues/40956)。

### 其它问题

更多 ambient 相关 issue 看 [这里](https://github.com/istio/istio/labels/area%2Fambient)。

## 参考资料

- [Istio Ambient Weekly Meeting Notes](https://docs.google.com/document/d/1SMlwliEnthgq7r2PjpLl1kCq3t8rAMbgu6r_lDAXJ0w)
