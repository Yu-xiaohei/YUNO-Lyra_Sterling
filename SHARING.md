# 微信、QQ 与浏览器分享

## 当前已实现

- HTML 原始响应包含 Open Graph、Twitter Summary 和兼容的网页标题、简介、图片信息；无需执行 JavaScript 即可读取。
- `assets/share-icon.png` 是现有正式 SVG 标志的 600 × 600 PNG 导出，白底，不是另一个品牌标志。原 SVG 未修改。
- 页头分享按钮优先调用系统 Web Share；不支持或调用失败时打开分享窗口，提供复制链接和 QQ 官方分享入口。取消系统分享不会再次弹窗。
- QQ 内置浏览器加载官方 SDK，调用 `mqq.data.setShareInfo`，设置右上角分享菜单的标题、简介、链接、图片。
- 微信前端支持 `wx.updateAppMessageShareData` 和 `wx.updateTimelineShareData`；只有配置签名服务后才启用。当前签名地址为空，微信接口尚未授权。

链接卡片由微信、QQ 或其他接收客户端生成，页面中的预览不等于聊天消息的实际样式。
粘贴一行 URL、系统分享和在客户端右上角菜单分享的处理可能不同。
网页不能强制指定卡片尺寸，客户端也可能缓存旧标题、旧图标，或不生成卡片。
已验证的是公开资源、浏览器操作和模拟 SDK 协议；尚未在微信、QQ 真机完成发给好友的验证。
实现未自动向任何人发送消息。

## 微信稳定自定义分享所缺的配置

微信官方接入要求先绑定 JS 接口安全域名，再使用签名配置 JS-SDK。
当前官方文档要求安全域名通过 ICP 备案验证，并有可用的对应接口权限。
目前的 `github.io` 默认地址未完成这些配置，不能仅添加几个 meta 标签就宣称微信自定义大卡片已可用。

需要：

1. 具备所需 JS-SDK 分享接口权限的公众号/服务号。
2. 可以在公众平台完成安全域名配置与校验的站点域名；域名需符合平台现行要求。
3. 一个 HTTPS 签名服务，在服务端使用账号凭据获取并缓存 jsapi_ticket，为当前页面 URL 生成签名。

本次没有创建公众号、购买域名、部署签名后端或更改网站域名。
不要把 AppSecret、access_token、jsapi_ticket 或 GitHub token 放进静态站点。

### 前端对接约定

在 `index.html` 中设置：

```html
<meta name="wechat-signature-endpoint" content="https://你的签名服务域名/wechat/sign">
```

页面在微信内发出 GET 请求，查询参数 `url` 为打开页面时的完整 URL，包含 query、不包含 hash。
服务端对这个准确 URL 签名，不应改写其参数或编码。服务端必须限制允许签名的站点域名和路径，
正确处理微信账号凭据缓存；跨域时只允许所需站点来源，支持浏览器 CORS。

响应为 JSON：

```json
{
  "appId": "wx示例账号标识",
  "timestamp": 1793700000,
  "nonceStr": "随机串",
  "signature": "40位十六进制SHA1签名"
}
```

以上仅说明字段，不是有效签名，不能直接上线使用。
响应不能包含 AppSecret、access_token 或 jsapi_ticket。
前端验证响应后加载微信官方 1.6.0 SDK，配置接口并设置分享内容。
签名失败、接口报错或加载失败不会影响航班页面、复制链接或其他分享功能。

## 分享文案与图片维护

主配置在 `index.html` 的 `og:title`、`og:description`、`og:url`、`og:image`。
修改文案时同步普通 description、Twitter、itemprop 标签和分享窗口内的文案。
更换域名时同步 canonical、og:url、所有分享图片的绝对 HTTPS 地址和微信安全域名/签名服务白名单。
更换同名 PNG 时更新图片 URL 中的版本参数，避免旧缓存。
分享窗口的链接与 QQ、微信菜单均指向网站首页，不带临时预览参数。
日常采集 AI 仍只更新 `data/prices.json`，不需要修改分享代码。

QQ 官方 SDK 按官方无版本地址在 QQ 内按需加载，未复制或修改第三方 SDK，
所以它的在线可用性与更新由 QQ 控制。SDK 不可用时保留静态分享信息及复制链接。

## 官方参考

- 微信 JS-SDK：https://developers.weixin.qq.com/doc/service/guide/h5/jssdk.html
- 微信 SDK：https://res.wx.qq.com/open/js/jweixin-1.6.0.js
- QQ SDK：https://open.mobile.qq.com/sdk/qqapi.js
- QQ 分享入口：https://connect.qq.com/widget/shareqq/index.html
- Open Graph：https://ogp.me/
