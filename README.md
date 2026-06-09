# 留白的作品空间

这是一个用于整合小游戏、网页小工具和生成图片作品的个人网站。

## 当前版本

- 图片式 UI，不走卡通风
- 深色背景 + 玻璃拟态面板
- 首页主视觉占位
- 小游戏合集卡片
- 生成照片作品墙
- 学习工具箱入口
- Cloudflare Pages Functions + R2 + D1 云端上传照片

## 文件结构

```text
04/
├── index.html
├── style.css
├── script.js
├── functions/
│   └── api/
│       ├── photos/
│       │   ├── index.js
│       │   └── [id].js
│       └── photo-file.js
├── wrangler.toml
├── server.js              # 本地 Node 测试备用
├── package.json           # 本地 Node 测试备用
├── .gitignore
└── README.md
```

## Cloudflare 部署方式

这个项目推荐使用：

```text
前端：Cloudflare Pages
后端接口：Cloudflare Pages Functions
图片文件存储：Cloudflare R2
照片信息数据库：Cloudflare D1
```

### 1. 创建 R2 存储桶

进入 Cloudflare 后台：

```text
R2 Object Storage → Create bucket
```

建议桶名：

```text
photo-room-04
```

### 2. 给 Pages 项目绑定 R2

进入你的 Cloudflare Pages 项目：

```text
Settings → Functions → R2 bucket bindings
```

新增绑定：

```text
Variable name: PHOTO_BUCKET
R2 bucket: photo-room-04
```

注意：变量名必须是 `PHOTO_BUCKET`，因为代码里就是用这个名字读取 R2。

### 3. 创建 D1 数据库

进入 Cloudflare 后台：

```text
Workers & Pages → D1 SQL Database → Create database
```

建议数据库名：

```text
photo-room-04-db
```

### 4. 给 Pages 项目绑定 D1

进入你的 Cloudflare Pages 项目：

```text
Settings → Functions → D1 database bindings
```

新增绑定：

```text
Variable name: PHOTO_DB
D1 database: photo-room-04-db
```

注意：变量名必须是 `PHOTO_DB`。

### 5. 重新部署 Pages

绑定完成后，回到 Pages 项目重新部署一次。部署完成后，网页上传照片会走：

```text
POST /api/photos
GET /api/photos
GET /api/photo-file?key=xxx
DELETE /api/photos/:id
```

## 上传照片

在网页的「生成照片 / 作品墙」区域：

1. 点「选择照片」
2. 选择一张或多张图片
3. 填标题和分类说明
4. 点「上传到照片墙」

上传成功后：

```text
图片文件 → Cloudflare R2 的 photos/ 目录
照片标题、分类、文件 key、上传时间 → Cloudflare D1 的 photos 表
```

`photos` 表会由接口自动创建，不需要你手动写 SQL。

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

## 本地 Node 测试备用

仓库里仍保留了 `server.js` 和 `package.json`，只是备用方案。Cloudflare 部署时主要使用 `functions/`、R2 和 D1。

本地 Node 运行：

```bash
npm install
npm start
```

打开：

```text
http://localhost:3000
```

## 注意

Cloudflare Pages 可以运行 Pages Functions，但需要在后台绑定 R2 和 D1。没有绑定 `PHOTO_BUCKET` 或 `PHOTO_DB` 时，照片上传接口会报错。
