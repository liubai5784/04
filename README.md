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
├── server.js              # 本地 Node 测试备用
├── package.json           # 本地 Node 测试备用
├── .gitignore
└── README.md
```

## Cloudflare 部署方式

这个项目现在推荐使用：

```text
前端：Cloudflare Pages
后端接口：Cloudflare Pages Functions
照片数据库：Cloudflare D1
```

图片会被前端压缩为较小的 JPG，然后以 Base64/Data URL 的形式存入 D1。

这种方案的优点是：

```text
不需要 R2
不需要信用卡
部署简单
网页端可以直接上传照片
```

缺点是：

```text
不适合存很多高清大图
更适合小规模作品展示
建议每张图控制在 900KB 以内
```

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
POST /api/photos
GET /api/photos
DELETE /api/photos/:id
```

不再需要：

```text
PHOTO_BUCKET
R2
/api/photo-file
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

仓库里仍保留了 `server.js` 和 `package.json`，只是备用方案。Cloudflare 部署时主要使用 `functions/` 和 D1。

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

Cloudflare Pages 可以运行 Pages Functions，但需要在后台绑定 D1。没有绑定 `PHOTO_DB` 时，照片上传接口会报错。
