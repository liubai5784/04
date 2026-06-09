# 留白的作品空间

这是一个用于整合小游戏、网页小工具和生成图片作品的个人网站。

## 当前版本

- 图片式 UI，不走卡通风
- 深色背景 + 玻璃拟态面板
- 首页主视觉占位
- 小游戏合集卡片
- 生成照片作品墙
- 学习工具箱入口
- Cloudflare Pages Functions + D1 上传照片
- 不需要 R2，不需要信用卡

## 文件结构

```text
04/
├── index.html
├── style.css
├── script.js
├── functions/
│   └── api/
│       └── photos/
│           ├── index.js
│           └── [id].js
├── package.json
├── .gitignore
└── README.md
```

## 重要说明

这个仓库是 Cloudflare Pages 项目，不是 Worker 项目。

不要使用这些命令：

```text
npx wrangler deploy
npx wrangler versions upload
```

项目根目录不再保留 `wrangler.toml`，避免 Cloudflare 把它误当成 Worker 部署。

## Cloudflare 简体中文界面创建方式

进入 Cloudflare 后台：

```text
Workers 和 Pages → 创建 → Pages → 连接到 Git
```

选择仓库：

```text
liubai5784/04
```

生产分支选择：

```text
main
```

构建配置填写：

```text
框架预设：无 / None
构建命令：npm run build
构建输出目录：.
根目录：/
部署命令：true
非生产分支部署命令：true
```

注意：

- `构建输出目录` 填英文句号 `.`，不要填 `/`。
- 如果界面允许部署命令为空，可以留空。
- 如果界面不允许部署命令为空，就填 `true`。
- 不要填 `none`，Cloudflare 会把它当命令执行。
- 不要填任何 `wrangler` 命令。

## 创建 D1 数据库

进入 Cloudflare 后台：

```text
Workers 和 Pages → D1 SQL 数据库 → 创建数据库
```

建议数据库名：

```text
photo-room-04-db
```

## 绑定 D1

进入你的 Cloudflare Pages 项目：

```text
设置 → 函数 → D1 数据库绑定
```

新增绑定：

```text
变量名称：PHOTO_DB
D1 数据库：photo-room-04-db
```

变量名必须是：

```text
PHOTO_DB
```

绑定完成后，重新部署一次。

## 接口

部署完成后，网页上传照片会走：

```text
GET /api/photos
POST /api/photos
DELETE /api/photos/:id
```

图片会被前端压缩，然后以 Base64/Data URL 的形式存入 D1。

## 判断是不是最新部署

首页顶部下方会显示：

```text
Version: Cloudflare Pages Functions + D1 · 2026-06-09
```

如果你打开网站看到的是 Hello World，或者看不到这个版本条，说明 Cloudflare 没有部署到这个仓库的 main 分支根目录，或者你打开的是另一个 Pages/Worker 项目。

## 后续添加小游戏链接

在 `script.js` 里修改 `games` 数组：

```js
const games = [
  {
    title: "答题练习小程序",
    desc: "说明文字",
    cover: "assets/images/game-cover.jpg",
    tags: ["Quiz", "学习"],
    url: "你的小游戏链接"
  }
];
```
