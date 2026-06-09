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

const defaultPhotos = [
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

let serverPhotos = [];

function getAllPhotos() {
  return [...serverPhotos, ...defaultPhotos];
}

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
  const photos = getAllPhotos();

  grid.innerHTML = photos.map(item => `
    <article class="photo-card image-placeholder" ${item.image ? `style="background-image: linear-gradient(to top, rgba(0,0,0,.68), rgba(0,0,0,.06)), url('${item.image}')"` : ""}>
      ${item.id ? `<button class="photo-remove" type="button" data-id="${item.id}" title="删除这张照片">×</button>` : ""}
      <div class="photo-title">${item.title}<span class="photo-meta">${item.meta}</span></div>
    </article>
  `).join("");

  document.querySelectorAll(".photo-remove").forEach(button => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const tip = document.querySelector("#uploadTip");
      try {
        const response = await fetch(`/api/photos/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("删除失败");
        const data = await response.json();
        serverPhotos = data.allPhotos || [];
        renderPhotos();
        renderCounts();
        tip.textContent = "已从后端删除这张照片。";
      } catch (error) {
        console.error(error);
        tip.textContent = "删除失败：请确认后端正在运行。";
      }
    });
  });
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
  document.querySelector("#photoCount").textContent = getAllPhotos().length;
  document.querySelector("#toolCount").textContent = tools.length;
}

async function loadServerPhotos() {
  const tip = document.querySelector("#uploadTip");
  try {
    const response = await fetch("/api/photos");
    if (!response.ok) throw new Error("接口不可用");
    serverPhotos = await response.json();
    tip.textContent = "后端已连接：上传的照片会保存到服务器 uploads 文件夹。";
  } catch (error) {
    console.warn("后端未连接：", error);
    tip.textContent = "后端未启动时只能看框架。运行 npm install 和 npm start 后，就可以真正上传照片。";
  }
  renderPhotos();
  renderCounts();
}

async function handlePhotoUpload(event) {
  event.preventDefault();

  const input = document.querySelector("#photoInput");
  const titleInput = document.querySelector("#photoTitle");
  const metaInput = document.querySelector("#photoMeta");
  const tip = document.querySelector("#uploadTip");
  const files = Array.from(input.files || []);

  if (!files.length) {
    tip.textContent = "请先选择至少一张图片。";
    return;
  }

  const formData = new FormData();
  files.forEach(file => formData.append("photos", file));
  formData.append("title", titleInput.value.trim() || "上传照片");
  formData.append("meta", metaInput.value.trim() || "网页端后端上传");

  tip.textContent = "正在上传到后端……";

  try {
    const response = await fetch("/api/photos", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("上传接口返回错误");

    const data = await response.json();
    serverPhotos = data.allPhotos || [];
    renderPhotos();
    renderCounts();

    input.value = "";
    titleInput.value = "";
    metaInput.value = "";
    tip.textContent = `已上传 ${files.length} 张照片，文件保存在后端 uploads 文件夹。`;
  } catch (error) {
    console.error(error);
    tip.textContent = "上传失败：请确认已经运行 npm install 和 npm start，并通过 http://localhost:3000 打开网站。";
  }
}

function bindUploadPanel() {
  const form = document.querySelector("#photoUploadForm");
  const clearButton = document.querySelector("#clearLocalPhotos");
  const tip = document.querySelector("#uploadTip");

  form.addEventListener("submit", handlePhotoUpload);
  clearButton.textContent = "刷新后端照片";
  clearButton.addEventListener("click", () => {
    tip.textContent = "正在刷新照片列表……";
    loadServerPhotos();
  });
}

renderGames();
renderPhotos();
renderTools();
renderCounts();
bindUploadPanel();
loadServerPhotos();
