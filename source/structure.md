# 项目结构解析

## 顶层目录

```txt
├── cni
│   ├── cmd
│   ├── pkg
├── istioctl
│   ├── cmd
│   └── pkg
├── operator
│   ├── cmd
│   ├── pkg
├── pilot
│   ├── cmd
│   ├── pkg
├── pkg
```

* `cni`, `istioctl`, `operator`, `pilot` 目录分别包含同名相应模块的代码。下面的 `cmd` 是模块下相应二进制的编译入口，`cmd` 下面的 `pkg` 是 `cmd` 中的代码需要调用的依赖逻辑。
* 多个模块共同依赖的一些逻辑会放到外层的 `pkg` 目录下。

## 梳理模块与二进制

`cni` 模块主要包含 `istio-cni` 和 `install-cni` 两个二进制，负责 cni 插件相关逻辑:

```txt
cni
├── cmd
│   ├── install-cni
│   ├── istio-cni

```

`istioctl` 和 `operator` 模块都主要是一个二进制，分别用于 cli 工具和 istio 安装。

`pilot` 是最核心的模块，有 `pilot-agent` 和 `pilot-discovery` 两个二进制:

```txt
pilot
├── cmd
│   ├── pilot-agent
│   └── pilot-discovery
```

- `pilot-discovery` 就是 "istiod"，即 istio 控制面。
- `pilot-agent` 是连接 istiod (控制面) 和 envoy (数据面) 之间的纽带，主要负责拉起和管理数据面进程。
