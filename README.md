# 留白的作品空间

这是一个用于整合小游戏、网页小工具和生成图片作品的个人网站。

## 当前版本

- 图片式 UI，不走卡通风
- 深色背景 + 玻璃拟态面板
- 首页主视觉占位
- 小游戏合集卡片
- 生成照片作品墙
- 学习工具箱入口
- 已加入 Node 后端，支持网页端上传照片

## 文件结构

```text
04/
├── index.html
├── style.css
├── script.js
├── server.js
├── package.json
├── .gitignore
└── README.md
```

运行后会自动生成：

```text
uploads/          # 上传后的图片文件
data/photos.json # 图片信息数据库
```

## 本地运行

先安装 Node.js，然后在项目目录运行：

```bash
npm install
npm start
```

打开：

```text
http://localhost:3000
```

这时网页里的上传通道就会真正把图片保存到后端 `uploads/` 文件夹里。

## 上传照片

在网页的「生成照片 / 作品墙」区域：

1. 点「选择照片」
2. 选择一张或多张图片
3. 填标题和分类说明
4. 点「上传到照片墙」

上传成功后，图片会保存到：

```text
uploads/
```

图片信息会保存到：

```text
data/photos.json
```

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

GitHub Pages 只能托管静态网页，不能运行这个 Node 后端。想使用真正上传功能，需要在本地运行，或者之后部署到 Render、Railway、Vercel、服务器等支持 Node 的平台。
