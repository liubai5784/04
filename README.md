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
├── wrangler.toml
├── package.json
├── .gitignore
└── README.md
```

## Cloudflare 部署方式

这个项目推荐使用：

```text
前端：Cloudflare Pages
后端接口：Cloudflare Pages Functions
照片数据库：Cloudflare D1
```

图片会被前端压缩为较小的 JPG，然后以 Base64/Data URL 的形式存入 D1。

## Cloudflare Pages 构建配置

创建或修改 Pages 项目时请这样填：

```text
Framework preset: None
Build command: npm run build
Build output directory: .
Root directory: /
Deploy command: true
```

注意：

- `Build output directory` 填英文句号 `.`，不要填 `/`。
- 如果 Cloudflare 允许 Deploy command 为空，可以留空。
- 如果 Cloudflare 不允许 Deploy command 为空，就填 `true`。
- 不要填 `npx wrangler deploy`，这个命令是 Worker 项目用的，不适合 Pages。

项目根目录里有 `functions/` 目录时，Cloudflare Pages 才会启用 Pages Functions。

## 创建 D1 数据库

进入 Cloudflare 后台：

```text
Workers & Pages → D1 SQL Database → Create database
```

建议数据库名：

```text
photo-room-04-db
```

## 给 Pages 项目绑定 D1

进入你的 Cloudflare Pages 项目：

```text
Settings → Functions → D1 database bindings
```

新增绑定：

```text
Variable name: PHOTO_DB
D1 database: photo-room-04-db
```

注意：变量名必须是：

```text
PHOTO_DB
```

因为代码里就是用这个名字读取 D1。

绑定完成后，重新部署一次 Cloudflare Pages。

## 接口

部署完成后，网页上传照片会走：

```text
GET /api/photos
POST /api/photos
DELETE /api/photos/:id
```

## 上传照片

在网页的「生成照片 / 作品墙」区域：

1. 点「选择照片」
2. 选择一张或多张图片
3. 填标题和分类说明
4. 点「上传到照片墙」

上传时前端会自动压缩图片。

上传成功后：

```text
图片内容、标题、分类、大小、类型、上传时间 → Cloudflare D1 的 photos 表
```

`photos` 表会由接口自动创建，不需要你手动写 SQL。

## 判断是不是最新部署

首页顶部下方会显示：

```text
Version: Cloudflare Pages Functions + D1 · 2026-06-09
```

如果你打开网站看到的是 Hello World，或者看不到这个版本条，说明 Cloudflare 没有部署到这个仓库的正确根目录，或者你打开的是另一个 Pages/Worker 项目。

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

## 注意

Cloudflare Pages 可以运行 Pages Functions，但需要在后台绑定 D1。没有绑定 `PHOTO_DB` 时，照片上传接口会报错。
