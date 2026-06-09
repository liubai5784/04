const games = [
  {
    title: "答题练习小程序",
    desc: "适合放概论课、结构力学或英语练习题，后续可接入你已有的网页小程序。",
    cover: "",
    tags: ["Quiz", "学习", "网页"],
    url: "#"
  },
  {
    title: "错题强化模式",
    desc: "预留给只练错题、答题卡、进度缓存等功能入口。",
    cover: "",
    tags: ["错题", "缓存", "进度"],
    url: "#"
  },
  {
    title: "互动小游戏占位",
    desc: "之后可以把你做过的小游戏链接放到这里，形成合集入口。",
    cover: "",
    tags: ["Game", "互动", "作品"],
    url: "#"
  }
];

const photos = [
  { title: "Warma 图片区", meta: "角色图 / 换装 / 场景", image: "" },
  { title: "工地项目图", meta: "桥墩 / 吊机 / 构件", image: "" },
  { title: "油画风作品", meta: "风格化图像", image: "" },
  { title: "日出光线系列", meta: "光影统一 / 场景替换", image: "" },
  { title: "视频提示词画面", meta: "14:5 / 动态构图", image: "" }
];

const tools = [
  { name: "公式速查", desc: "结构力学、大物、考试前速看公式卡片。", url: "#" },
  { name: "考试急救卡", desc: "临考前按章节整理重点、易错点、题型。", url: "#" },
  { name: "图片提示词库", desc: "保存 Warma、工地、油画风等常用提示词。", url: "#" }
];

function createPlaceholder(label, className = "") {
  return `<div class="image-placeholder ${className}"><span>${label}</span></div>`;
}

function renderGames() {
  const grid = document.querySelector("#gamesGrid");
  grid.innerHTML = games.map(item => `
    <article class="project-card">
      ${item.cover ? `<img class="card-cover" src="${item.cover}" alt="${item.title}">` : createPlaceholder("游戏封面占位", "card-cover")}
      <div class="card-body">
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <div class="tag-row">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
      </div>
    </article>
  `).join("");
}

function renderPhotos() {
  const grid = document.querySelector("#galleryGrid");
  grid.innerHTML = photos.map(item => `
    <article class="photo-card image-placeholder" ${item.image ? `style="background-image: linear-gradient(to top, rgba(0,0,0,.55), transparent), url('${item.image}')"` : ""}>
      <div class="photo-title">${item.title}<span class="photo-meta">${item.meta}</span></div>
    </article>
  `).join("");
}

function renderTools() {
  const list = document.querySelector("#toolList");
  list.innerHTML = tools.map((item, index) => `
    <article class="tool-item">
      <div class="tool-index">${String(index + 1).padStart(2, "0")}</div>
      <div>
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
      </div>
      <a class="tool-link" href="${item.url}">打开 →</a>
    </article>
  `).join("");
}

function renderCounts() {
  document.querySelector("#gameCount").textContent = games.length;
  document.querySelector("#photoCount").textContent = photos.length;
  document.querySelector("#toolCount").textContent = tools.length;
}

renderGames();
renderPhotos();
renderTools();
renderCounts();
