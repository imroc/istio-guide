# Pod 启动卡住: MountVolume.SetUp failed for volume "istio-token"

## 现象

Istio 相关的 Pod (包括注入了 sidecar 的 Pod) 一直卡在 ContainerCreating，起不来，describe pod 报错 `MountVolume.SetUp failed for volume "istio-token" : failed to fetch token: the server could not find the requested resource`:

![](https://image-host-1251893006.cos.ap-chengdu.myqcloud.com/2023%2F09%2F22%2F20230922191212.png)

## 分析

根据官方文档([Configure third party service account tokens](https://istio.io/latest/docs/ops/best-practices/security/#configure-third-party-service-account-tokens)) 的描述可以得知:
* istio-proxy 需要使用 K8S 的 ServiceAccount token，而 K8S 支持 `third party` 和 `first party` 两种 token。
* `third party token` 安全性更高，istio 默认使用这种类型。
* 不是所有集群都支持这种 token，取决于 K8S 版本和 apiserver 配置。

如果集群不支持 `third party token`，就会导致 ServiceAccount token 不自动创建出来，从而出现上面这种报错。

## 什么是 third party token ?

其实就是 [ServiceAccountTokenVolumeProjection](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#service-account-token-volume-projection) 这个特性，在 1.12 beta，1.20 GA。

推出该特性是为了增强 ServiceAccount token 的安全性，可以设置有效期(会自动轮转)，避免 token 泄露带来的安全风险，还可以控制 token 的受众。

该特性在 istio 中用来配合 SDS 以增强安全性，参考 [Istio私钥管理利器SDS浅析](https://developer.aliyun.com/article/742572)。

如何判断集群是否启用了该特性呢？可通过一下命令查询:

``` bash
kubectl get --raw /api/v1 | jq '.resources[] | select(.name | index("serviceaccounts/token"))'
```

若返回空，说明不支持；若返回如下 json，说明支持:

```json
{
    "name": "serviceaccounts/token",
    "singularName": "",
    "namespaced": true,
    "group": "authentication.k8s.io",
    "version": "v1",
    "kind": "TokenRequest",
    "verbs": [
        "create"
    ]
}
```

## 解决方案

### 方案一：安装 istio 时不使用 third party token

官方称使用 istioctl 安装会自动检测集群是否支持 `third party token`，但据 [issue](https://github.com/istio/istio/issues/21968#issuecomment-607474174) 反馈可能有 bug，还是建议强制指定用 `first party token`，用参数 `--set values.global.jwtPolicy=first-party-jwt` 来显示指定，示例:

```bash
istioctl manifest generate  --set profile=demo  --set values.global.jwtPolicy=first-party-jwtm > istio.yaml
```

### 方案二：集群启用 ServiceAccountTokenVolumeProjection

如何启用 ServiceAccountTokenVolumeProjection 这个特性呢？需要给 apiserver 配置类似如下的参数:

```yaml
--service-account-key-file=/etc/kubernetes/pki/sa.key # 这个一般都会配，重要的是下面三个参数
--service-account-issuer=kubernetes.default.svc
--service-account-signing-key-file=/etc/kubernetes/pki/sa.key # 注意替换实际路径
--api-audiences=kubernetes.default.svc
```
