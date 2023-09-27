# 编译与测试

## 基于最新代码编译并 push 镜像

下载最新代码:

```bash
git clone http://github.com/istio/istio.git
```

切换分支:

```bash
cd istio
git checkout -b experimental-ambient origin/experimental-ambient
```

编译所有镜像:

```bash
export HUB="registry.imroc.cc/istio"
export TAG="ambient"
make docker
```

查看镜像列表：

```bash
$ docker images | grep ambient
registry.imroc.cc/istio/install-cni               ambient                                                  d3d8fa9fff24   2 days ago      307MB
registry.imroc.cc/istio/proxyv2                   ambient                                                  94ac94a14ed6   2 days ago      277MB
registry.imroc.cc/istio/istioctl                  ambient                                                  76fea2b66ed7   2 days ago      190MB
registry.imroc.cc/istio/operator                  ambient                                                  574faf14c66b   2 days ago      191MB
registry.imroc.cc/istio/app                       ambient                                                  7c648c702595   2 days ago      188MB
registry.imroc.cc/istio/pilot                     ambient                                                  d914093f7809   2 days ago      189MB
registry.imroc.cc/istio/ext-authz                 ambient                                                  88dc93477b75   2 days ago      112MB
```

最后再使用 docker push 上传镜像。

实际上测试 ambient 是需要其中几个，可以用下面命令只编译需要的镜像:

```bash
make docker.pilot
make docker.install-cni
make docker.proxyv2
make docker.istioctl
```

## 从镜像拷贝出 istioctl 二进制

下面介绍将 istioctl 二进制拷贝出来的方法，首先用 istioctl 镜像运行一个容器:

```bash
docker run --rm -it --entrypoint="" --name istioctl registry.imroc.cc/istio/istioctl:ambient bash
```

再利用 docker cp 将二进制拷贝出来:

```bash
docker cp istioctl:/usr/local/bin/istioctl ./istioctl
```

## 使用 istioctl 安装 ambient mesh

```bash
./istioctl install --set profile=ambient --set hub=registry.imroc.cc/istio --set tag=ambient
```