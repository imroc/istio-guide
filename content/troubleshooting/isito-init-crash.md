# istio-init crash

## 问题描述

在 istio 环境下有 pod 处于 `Init:CrashLoopBackOff` 状态:

```txt
wk-sys-acl-v1-0-5-7cf7f79d6c-d9qcr                            0/2     Init:CrashLoopBackOff   283        64d     172.16.9.229    10.1.128.6     <none>           <none>
```

查得 istio-init 的日志:

<FileBlock file="istio/istio-init-crash-log.txt" />

## 原因与解决方案

跟这个 issue 基本一致 https://github.com/istio/istio/issues/24148

直接原因: 这种情况应该通常是清理了已退出的 istio-init 容器，导致 k8s 检测到 pod 关联的容器不在了，然后会重新拉起被删除的容器，而 istio-init 的执行不可重入，因为之前已创建了 iptables 规则，导致后拉起的 istio-init 执行 iptables 失败而 crash。

根因与解决方案: 清理的动作通常是执行了  `docker container rm` 或 `docker container prune` 或 `docker system prune`。 一般是 crontab 定时脚本里定时清理了容器导致，需要停止清理。
