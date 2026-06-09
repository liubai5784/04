# 留白的作品空间

这是一个用于整合小游戏、网页小工具和生成图片作品的个人静态网站。

## 当前版本

- 图片式 UI，不走卡通风
- 深色背景 + 玻璃拟态面板
- 首页主视觉占位
- 小游戏合集卡片
- 生成照片作品墙
- 学习工具箱入口
- 数据集中写在 `script.js`，方便后续维护

## 文件结构

```text
04/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 后续添加图片

建议新建目录：

```text
assets/images/
```

然后把图片放进去，比如：

```text
assets/images/hero.jpg
assets/images/warma-01.jpg
assets/images/site-bridge-01.jpg
```

再到 `script.js` 里修改：

```js
const photos = [
  { title: "Warma 图片区", meta: "角色图 / 换装 / 场景", image: "assets/images/warma-01.jpg" }
];
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

## 部署建议

可以直接用 GitHub Pages 部署：

1. 打开仓库 Settings
2. 找到 Pages
3. Source 选择 Deploy from a branch
4. Branch 选择 main / root
5. 保存后等待生成访问链接
