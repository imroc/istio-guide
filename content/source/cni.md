# CNI 模块源码解析

## install-cni 

### 主要逻辑梳理

`install-cni` 用于 daemonset 部署到每个节点，主要逻辑如下：
- 为节点安装 istio-cni 插件。
- 检测 cni 配置，如果检测到被修改，立即覆盖回来。
- 如果是 ambient 模式，会起一个 controller 来 watch pod，当本节点 ztunnel pod 起来时，会自动在节点上创建 ambient 模式中节点上所需的 iptables 规则、虚拟网卡以及策略路由。
- 退出时清理 istio-cni 插件。

main 函数入口在 `cni/cmd/install-cni/main.go`，`cmd.GetCommand()` 获取 cobra 的 Command，也就是二进制运行入口:

```go
rootCmd := cmd.GetCommand()
if err := rootCmd.ExecuteContext(ctx); err != nil {
	os.Exit(1)
}
```

`rootCmd.ExecuteContext(ctx)` 会调用 cobra Command 的 `RunE` 函数 (`cni/pkg/cmd/root.go`):

```go
var rootCmd = &cobra.Command{
	RunE: func(c *cobra.Command, args []string) (err error) {
...
```

继续看看 `RunE` 里面的逻辑，`constructConfig()` 会从启动参数和环境变量中读取参数，进行合并，构造出 `install-cni` 的配置信息 Config 对象:

```go
if cfg, err = constructConfig(); err != nil {
	return
}
```

根据配置的端口，将指标监控信息暴露到 `/metrics` 接口:

```go
		// Start metrics server
		monitoring.SetupMonitoring(cfg.InstallConfig.MonitoringPort, "/metrics", ctx.Done())
```

监听 Unix Domain Socket，暴露 HTTP 接口，用于接收来自 `istio-cni` 产生的日志，收到日志后就会在 `install-cni` 这里打印出来:

```go
// Start UDS log server
udsLogger := udsLog.NewUDSLogger()
if err = udsLogger.StartUDSLogServer(cfg.InstallConfig.LogUDSAddress, ctx.Done()); err != nil {
	log.Errorf("Failed to start up UDS Log Server: %v", err)
	return
}
```

> 因为 `istio-cni` 自身不是常驻进程，被 kubelet 调用后立即退出，所以需要将日志投递给 `install-cni` 统一打印和记录，便于排查问题。

如果启用了 ambient 模式，会启动一个 ambient 模式所需要的常驻运行的 server:

```go
if cfg.InstallConfig.AmbientEnabled {
	// Start ambient controller
	server, err := ambient.NewServer(ctx, ambient.AmbientArgs{
		SystemNamespace: ambient.PodNamespace,
		Revision:        ambient.Revision,
	})
	if err != nil {
		return fmt.Errorf("failed to create ambient informer service: %v", err)
	}
	server.Start()
}
```

接下来是最核心最关键的逻辑，根据安装配置将 `istio-cni` 插件安装到节点上，同时 watch 文件变化，如果被修改就自动覆盖回来:

```go
installer := install.NewInstaller(&cfg.InstallConfig, isReady)

repair.StartRepair(ctx, &cfg.RepairConfig)

if err = installer.Run(ctx); err != nil {
  ...
```

### 安装 CNI 插件的逻辑梳理

`install.Run(ctx)` 是安装 CNI 逻辑的入口，内部 `in.install(ctx)` 是每次安装 CNI 插件时执行的逻辑:

```go
if in.cfg.CNIEnableInstall {
	if err = in.install(ctx); err != nil {
		return
	}
    ...
```

在 `install` 中，先将 istio CNI 插件的二进制拷贝到节点的 CNI 二进制目录 (`/opt/cni/bin`):

```go
if err = copyBinaries(
	in.cfg.CNIBinSourceDir, in.cfg.CNIBinTargetDirs,
	in.cfg.UpdateCNIBinaries, in.cfg.SkipCNIBinaries); err != nil {
	cniInstalls.With(resultLabel.Value(resultCopyBinariesFailure)).Increment()
	return
}
```

然后创建 CNI 二进制运行起来需要的 kubeconfig 文件:

```go
if in.kubeconfigFilepath, err = createKubeconfigFile(in.cfg, in.saToken); err != nil {
	cniInstalls.With(resultLabel.Value(resultCreateKubeConfigFailure)).Increment()
	return
}
```

最后是创建并覆盖 CNI 插件配置文件:

```go
if in.cniConfigFilepath, err = createCNIConfigFile(ctx, in.cfg, in.saToken); err != nil {
	cniInstalls.With(resultLabel.Value(resultCreateCNIConfigFailure)).Increment()
	return
}
```

## istio-cni

main 函数入口在 `cni/cmd/istio-cni/main.go`:

```go
func main() {
    ...
	skel.PluginMain(plugin.CmdAdd, plugin.CmdCheck, plugin.CmdDelete, version.All,
		fmt.Sprintf("CNI plugin istio-cni %v", istioversion.Info.Version))
}
```

关键逻辑是调用 CNI 项目中的 `skel.PluginMain` 这个函数来注册 CNI 插件处理函数。

最重要的是 `plugin.CmdAdd`，即每次 kubelet 创建 Pod 时，调用 `istio-cni` 插件来设置容器网络的时候，就会走到 `CmdAdd` 这个函数。

首先会解析 kubelet 调用 `istio-cni` 时通过标准输入传来的配置，以及 `install-cni` 里面的 ambient server 写入的 ambient 配置文件。

```go
// CmdAdd is called for ADD requests
func CmdAdd(args *skel.CmdArgs) (err error) {
    ...
   	conf, err := parseConfig(args.StdinData)
	if err != nil {
		log.Errorf("istio-cni cmdAdd failed to parse config %v %v", string(args.StdinData), err)
		return err
	}
    ...
	ambientConf, err := ambient.ReadAmbientConfig()
	if err != nil {
		log.Errorf("istio-cni cmdAdd failed to read ambient config %v", err)
		return err
	}
    ...
```

### 主题逻辑梳理

`istio-cni` 是被 `install-cni` 安装到节点的 CNI 插件二进制，在 kubelet 每次创建 pod 时会调用的二进制，主要功能如下：
- 当要创建的 Pod 是网格内的 Pod 时，在 Pod 所在 netns 创建相关 iptables 规则以实现流量拦截(取代 `istio-init` 容器)。
- 如果是网格内的 Pod，且数据面使用的 ambient 模式的 ztunnel 而不是 sidecar，自动更新 ambient 模式在节点上所需的 ipset, 路由表等。
