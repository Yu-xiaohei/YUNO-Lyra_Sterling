# 于の旅行侦探

可直接托管到 GitHub Pages 的静态网站。原始 HTML 未改动。

## 文件

- `index.html`：页面入口。
- `styles.css`：桌面、平板、手机及深色样式。
- `app.js`：任务切换、按日期查看历史方案、三级展示、图表与 GSAP 动效。
- `share.js`：浏览器分享、复制链接、QQ 分享配置与可选微信签名接入。
- `SHARING.md`：当前分享支持、微信安全域名和签名服务前提、对接格式及真机验证限制。
- `data/prices.json`：唯一价格数据源，保留原始 4 条历史记录及 12 个方案，并将已有方案保存为 4 个按日快照。
- `AI_DATA_UPDATE.md`：可直接交给另一个 AI 的数据更新说明，包含四项任务、字段、失败处理与 GitHub 写入约定。
- `.nojekyll`：静态文件发布标记。
- `assets/vendor/`：固定版本的 GSAP 3.15.0 和 Lucide 1.66.0。
- `assets/YUNO-Lyra_Sterling-logo.svg`：用户提供的正式标志，按要求去掉底层黑色矩形，透明显示于页头和 favicon。
- `assets/share-icon.png`：正式标志的 600 × 600 PNG 导出，用于客户端分享缩略图。
- `assets/*.jpg`：东京、大阪、北京景色照片，本地保存。
- `assets/photo-credits.json`：新增照片的作者、来源、许可和缩略图记录。

## 预览与部署

在本目录运行 `python -m http.server 4173 --bind 127.0.0.1`，打开
`http://127.0.0.1:4173`。页面用 fetch 读取 JSON，不能通过双击 HTML
的 `file://` 地址完整使用。

解压交付 ZIP 后，将其内容上传到 GitHub 仓库根目录并启用 Pages，不需要构建。
仓库根目录应直接看到 index.html，不要只上传 ZIP 文件或多套一层 flight-watch 文件夹。
路径均为相对路径，支持仓库子路径。只上传本目录，不需要 work、docs 或测试产物。
支持 `#task-1` 到 `#task-4` 直接打开指定任务。

## AI 更新数据约定

只修改 `data/prices.json`，不要覆盖界面文件。保留 `schemaVersion: 1`。

- `history`：每天每任务一条记录；同一 `(date, task)` 不能重复。
  更新当天记录或追加新日期，保留历史。字段为 `date`、`task`、
  `lowest`、`r1`、`r2`、`r3`。日期用 `YYYY-MM-DD`，价格为人民币数值。
- `latest`：最新查询的方案。每任务最多三个，`rank` 为 1、2、3，
  不重复；价格由低到高排名。字段为 `task`、`rank`、`price`、
  `airline`、`baggage`、`legs`。
- `snapshots`：完整历史方案，每个 `(date, task)` 一份。字段为 `date`、`task`、
  `options`，options 与该次成功查询的 latest 格式和内容一致，保留全部航段。
  同日重跑替换该快照，跨天追加，保留全部旧快照；不能用当天新方案补造旧日详情。
- `legs`：每一航段包含 `journey`、`date`、`dep`、`from`、`arr`、
  `to`、`duration`、`seat`。同一程的中转航段使用相同 `journey`。
  跨日到达增加 `arrDate`。建议日期写完整年份，例如 `2027-07-05`。
- 同时更新当天 `history`、`snapshots` 和对应 `latest`，保持日期、排名与价格一致。
- 查询失败时保留该任务旧记录；不要编造价格，不要将失败写为 0。
- 完成写入前校验 JSON，建议原子替换整个文件，再提交 GitHub。
- GitHub token 仅保存在 AI 的安全执行环境，不写入前端、JSON 或仓库。

页面不含天巡抓取程序，也不包含定时任务。本次仅改造展示层；
原有 AI 流程需要改为更新上述 JSON。价格真实性、行李额和机型信息
沿用输入数据，本次未重新查询核验。

## 展示与动效

一级：四个行程 Tab、价格概览、历史走势与今日对比。
二级：点击某个方案，查看各程摘要。
三级：点击某一程，展开具体航段、日期、行李及座椅信息。
同级方案和行程自动互斥展开，避免长页堆叠。

“航班方案”中的记录日期可切换历史快照，左右按钮跳到相邻记录日，
历史日期旁的回转图标可回到最新记录。每项任务分别保留本次浏览选择。
点击走势图的日期区域或聚焦后按 Enter / 空格，也会切换下方方案日期。
顶部概览和今日价格对比始终显示最新记录，不随历史详情选择改变。
只有价格的旧日期显示历史排名价格和“当天未保存航班详情”，不会冒用最新航班。
旧版没有 snapshots 的 JSON 仍兼容，仅在最新方案价格与最新记录一致时显示最新详情。
当前真实数据只有 2026-11-03 一天；将来继续按规范采集后，历史日期会自动增加。

四个任务的默认封面各不相同。图片保留初版横幅位置与尺寸，
翻阅按钮叠放在右下角。景色卡片支持左右按钮、分页点、
键盘方向键和手机左右滑动；多程任务包含东京、大阪和北京。
四个 Tab 的完整路线统一单行显示；手机横向滑动查看，
切换时将选中 Tab 滚入可见范围，隐藏滚动条但保留触摸滑动。
地区标注为中国与日本，页脚提醒居中。
桌面航段两端贴近容器两侧，各自时间的正下方居中显示节点，
连接线随可用宽度伸展。
嵌套详情使用可反向的 CSS 网格折叠，关闭结束后才设置 hidden，
避免直接隐藏产生闪烁。GSAP 用于任务切换、景色翻阅和图表等动效。
界面文件与照片带资源版本参数；更改界面后同步更新 index.html 中
CSS、JS 的版本，替换同名照片时也更新 app.js 中照片版本，避免旧缓存与新结构混用。

前三项任务支持 7 天、30 天及全部，第四项任务增加 90 天；
筛选以最新记录日为截止日。支持图例开关、鼠标和键盘查看图表价格、键盘切换 Tab、
深色模式及系统减少动画偏好。只有一天记录时显示单日价格点，
不会添加示例趋势。历史不足时显示“基准日”。

## 第三方

- GSAP 3.15.0：https://gsap.com/standard-license/
- Lucide 1.66.0（ISC）：https://github.com/lucide-icons/lucide/blob/main/LICENSE
- 东京照片来源端点：https://images.unsplash.com/photo-1540959733332-eab4deabeeaf
- 东京塔：David Kernan，CC BY 4.0。
- 大阪城：663highland，CC BY 2.5。
- 晴空塔与富士山：Atomark，CC BY 2.0。
- 北京天坛：Shujianyang，CC BY-SA 4.0。
- 八达岭长城：Reinhold Möller，CC BY-SA 4.0。
- 道顿堀：Type specimen，CC BY-SA 3.0。
- 浅草寺雷门：Ph0kin，公有领域。
- 故宫：Joshua Doubek，CC BY-SA 3.0。
- 颐和园：xiquinhosilva，CC BY 2.0。
- 上述照片取自 Wikimedia Commons，使用 960px 缩略图并在页面裁切展示；
  每张照片的来源链接在卡片左上角，完整许可链接见 `assets/photo-credits.json`。

交付中包含第三方库原有版权头。照片用于目的地展示，不代表航班运营或价格信息。
