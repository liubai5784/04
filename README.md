# 留白的作品空间

这是一个用于整合小游戏、网页小工具和生成图片作品的个人网站。

当前正式部署方案是 **Cloudflare Pages + Pages Functions + D1**。图片会在前端压缩，然后以 Base64/Data URL 的形式保存到 D1 数据库里。这个版本不需要 R2，也不需要信用卡。

## 文件结构

```text
04-main/
├── index.html
├── style.css
├── script.js
├── server.js
├── functions/
│   └── api/
│       └── photos/
│           ├── index.js
│           └── [id].js
├── assets/
│   └── images/
│       └── hero.png
├── package.json
└── README.md
```

## 本地预览

只看静态页面时，可以直接打开 `index.html`。

如果想在本地测试照片上传接口：

```bash
npm install
npm start
```

然后打开：

```text
http://localhost:3000
```

本地上传会写入 `uploads/` 和 `data/photos.json`。这些文件已经在 `.gitignore` 中忽略。

## Cloudflare Pages 部署

这个仓库是 Cloudflare Pages 项目，不是 Worker 项目。不要使用：

```text
npx wrangler deploy
npx wrangler versions upload
```

在 Cloudflare 后台进入：

```text
Workers 和 Pages -> 创建 -> Pages -> 连接到 Git
```

推荐配置：

```text
框架预设：无 / None
构建命令：npm run build
构建输出目录：.
根目录：/
部署命令：true
非生产分支部署命令：true
```

如果界面允许部署命令为空，可以留空。不要填写 `none`，Cloudflare 会把它当作命令执行。

## 创建并绑定 D1

在 Cloudflare 后台进入：

```text
Workers 和 Pages -> D1 SQL 数据库 -> 创建数据库
```

建议数据库名：

```text
photo-room-04-db
```

然后进入 Pages 项目：

```text
设置 -> 函数 -> D1 数据库绑定
```

新增绑定：

```text
变量名称：PHOTO_DB
D1 数据库：photo-room-04-db
```

变量名必须是 `PHOTO_DB`。绑定完成后重新部署一次。

## 接口

部署完成后，照片功能会使用这些接口：

```text
GET /api/photos
POST /api/photos
DELETE /api/photos/:id
```

如果页面提示 D1 接口不可用，请检查 Pages Functions 是否启用，以及 D1 是否绑定到 `PHOTO_DB`。

## 后续扩展

小游戏入口在 `script.js` 的 `games` 数组里维护：

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

工具入口在 `script.js` 的 `tools` 数组里维护。

## 后台页面

照片上传、刷新和删除入口已经移到：

```text
/admin/
```

前台 `index.html` 只展示作品，不显示上传表单和删除按钮。

后台还可以编辑首页入口：

- 小游戏入口：标题、说明、标签、封面地址、跳转链接
- 工具入口：名称、说明、跳转链接

本地直接打开 HTML 时，入口配置会先保存在当前浏览器的 `localStorage`。部署到 Cloudflare Pages 并绑定 `PHOTO_DB` 后，配置会通过 `/api/site-config` 保存到 D1。

如果要整合以前做过的项目，可以把项目文件夹放进仓库，例如：

```text
projects/quiz/
projects/formula-card/
```

然后在后台把跳转链接填成：

```text
/projects/quiz/
/projects/formula-card/
```
