# 实用脚本

## istioctl

### 查看 sidecar 证书是否正常

```bash
$ istioctl proxy-config secret accountdeletecgi-5b9d6b586-wzb7b
RESOURCE NAME     TYPE           STATUS     VALID CERT     SERIAL NUMBER                               NOT AFTER                NOT BEFORE
default           Cert Chain     ACTIVE     true           198001071566761875257861959297039696827     2021-04-16T03:33:03Z     2021-04-15T03:33:03Z
ROOTCA            CA             ACTIVE     true           205820131934050053680230040513977871884     2031-03-24T02:58:23Z     2021-03-26T02:58:23Z
```

### 查看 sidecar 证书详情

```bash
$ istioctl -n istio-test proxy-config secret productpage-v1-578c57988-j8g9d -o json | jq '[.dynamicActiveSecrets[] | select(.name == "default")][0].secret.tlsCertificate.certificateChain.inlineBytes' -r | base64 -d | openssl x509 -noout -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            1b:6c:19:da:04:db:cb:1b:29:48:f8:09:60:35:22:75
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: L=cls-5u6csmhf, O=Istio, CN=Intermediate CA
        Validity
            Not Before: Apr 15 03:57:51 2021 GMT
            Not After : Apr 16 03:57:51 2021 GMT
        Subject:
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                Public-Key: (2048 bit)
                Modulus:
                    00:dd:4f:bb:65:fd:d2:9c:7d:29:00:a9:6b:8c:b2:
                    8b:12:17:5f:6f:1b:d6:db:a2:7a:69:23:21:6a:d1:
                    38:4e:44:d0:c9:f4:6d:13:e9:97:86:54:f2:30:e6:
                    fe:9e:41:7c:95:a7:20:ff:bb:de:62:8e:49:58:90:
                    7a:38:be:15:f1:96:6e:ff:7a:c4:61:d8:a8:25:f1:
                    92:ee:33:ae:86:bb:63:38:2c:e7:32:a5:11:be:79:
                    3e:83:67:17:4e:91:df:0a:3e:52:11:60:9a:83:5d:
                    e4:92:9a:f6:29:43:7e:60:13:03:4d:ed:fc:d1:5c:
                    e9:5b:a9:a6:ef:b8:f5:82:78:a1:ef:15:43:17:40:
                    b3:48:c2:27:33:ac:0e:aa:00:c9:da:3f:ee:5d:1a:
                    d7:7a:4f:e3:e0:26:e8:67:1a:c1:44:c5:f3:d0:1c:
                    e1:e4:53:a5:a8:0b:04:47:cd:df:d2:a9:1b:47:8f:
                    3e:dc:9a:b6:b3:a8:6d:47:da:4d:68:dd:4f:82:3f:
                    aa:25:6d:8e:c5:8c:9d:1e:7c:93:4c:55:a3:59:d7:
                    a6:42:04:05:52:01:6d:a1:c8:8f:67:48:b4:16:4b:
                    46:6e:1e:5b:97:65:99:fe:5f:f7:f2:ba:ea:3f:34:
                    28:f1:e6:18:4d:d9:de:00:f2:fd:4a:9c:f9:a5:e2:
                    9d:5b
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment
            X509v3 Extended Key Usage:
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE
            X509v3 Authority Key Identifier:
                keyid:A0:62:8E:B4:53:64:D9:1D:DC:21:41:D8:05:93:E4:6D:27:82:20:4E

            X509v3 Subject Alternative Name: critical
                URI:spiffe://cluster.local/ns/istio-test/sa/bookinfo-productpage
    Signature Algorithm: sha256WithRSAEncryption
         ab:0d:b5:e6:df:50:02:d2:85:47:62:18:b0:af:89:cc:3a:06:
         a1:19:a8:2c:58:9c:e4:1d:34:3b:f8:a2:a7:f6:f8:0e:af:a8:
         1b:35:79:9d:72:a2:a9:96:14:37:c8:76:e2:50:ae:d4:c6:33:
         43:a5:0e:e4:c9:95:a8:81:9a:6a:72:e5:eb:3c:55:20:70:a4:
         27:3c:6d:88:da:03:75:3a:99:d0:72:c2:b3:2e:66:9e:00:9a:
         13:c5:61:20:fc:35:99:30:93:33:e6:8a:2d:b4:b0:0f:23:3a:
         a1:3d:4f:01:bf:cc:2b:38:2a:41:23:13:31:52:84:d7:8d:cb:
         71:63:28:e6:1f:1f:95:20:41:63:1a:a6:5f:a5:d0:3b:35:97:
         4b:8d:6c:55:59:34:e2:36:ff:a0:38:4c:f0:1f:a3:16:bf:bc:
         75:53:35:20:60:b2:0d:4d:bd:d1:ab:a6:28:60:e4:d7:0c:e3:
         cc:19:cb:d1:4c:e7:3d:fc:21:aa:eb:e6:f4:a6:0f:ed:cd:da:
         db:ae:4c:fa:cf:55:f8:ea:d1:55:d5:6c:51:95:3f:47:13:b7:
         20:e2:5d:cc:b0:ea:8d:99:e1:9f:40:df:d3:97:af:a5:69:f4:
         c6:b7:9c:c4:55:67:47:59:2b:53:40:f2:48:88:9b:75:77:00:
         22:98:f7:61:74:05:8c:8b:e4:1f:be:c8:e9:7a:8f:9a:5d:ff:
         1d:48:0a:e9:75:da:1e:35:93:a4:a0:c0:f8:78:bc:25:a2:63:
         d3:35:83:1f:15:28:a7:31:de:5a:d8:ae:56:f8:8c:ea:da:13:
         01:81:aa:6f:0f:a5:39:78:e6:b6:e3:1c:ff:7c:03:50:22:04:
         64:0a:dc:14:2c:ed:7d:ec:91:73:dc:44:3e:60:bc:d8:69:c3:
         7c:5b:d5:16:53:1c:24:2e:1b:51:fb:93:31:37:b3:80:e6:f2:
         07:46:09:8d:d5:2c:a4:f4:e3:14:b3:d9:d7:de:de:9c:bf:84:
         67:66:e1:b9:85:26:1c:8f:5c:8d:9f:5f:53:b7:ed:c7:2b:9d:
         57:3f:3c:d6:86:f4:d8:d8:72:c3:4c:be:5e:48:a4:ac:b9:c5:
         b1:6c:4b:dc:83:a2:bc:80:c2:34:c3:1a:68:7f:e8:e8:b9:eb:
         39:2a:6d:3d:2d:90:e2:9c:52:dc:a2:99:e3:dc:dc:5a:f7:71:
         9d:5f:67:93:d6:e3:68:a2:f9:7b:6e:64:a6:0c:09:95:f6:28:
         02:e4:3f:63:fc:09:12:f7:8f:ce:4a:c3:38:02:0c:35:64:f1:
         74:93:36:93:6d:e2:8e:5b:07:b9:5a:f8:14:32:69:4f:64:8d:
         6e:a4:b0:95:73:36:b6:92
```
* 确保 `Subject Alternative Name` 包含正确的 spiffe URI，如 `URI:spiffe://cluster.local/ns/istio-test/sa/bookinfo-productpage`。
