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

const LOCAL_PHOTOS_KEY = "lb-gallery-local-photos";
let localPhotos = loadLocalPhotos();

function getAllPhotos() {
  return [...localPhotos, ...defaultPhotos];
}

function loadLocalPhotos() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PHOTOS_KEY)) || [];
  } catch (error) {
    console.warn("本地照片读取失败：", error);
    return [];
  }
}

function saveLocalPhotos() {
  localStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(localPhotos));
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

  grid.innerHTML = photos.map((item, index) => `
    <article class="photo-card image-placeholder" ${item.image ? `style="background-image: linear-gradient(to top, rgba(0,0,0,.68), rgba(0,0,0,.06)), url('${item.image}')"` : ""}>
      ${item.local ? `<button class="photo-remove" type="button" data-index="${index}" title="删除这张本地照片">×</button>` : ""}
      <div class="photo-title">${item.title}<span class="photo-meta">${item.meta}</span></div>
    </article>
  `).join("");

  document.querySelectorAll(".photo-remove").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      localPhotos.splice(index, 1);
      saveLocalPhotos();
      renderPhotos();
      renderCounts();
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

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

  tip.textContent = "正在读取图片……";

  try {
    const createdPhotos = await Promise.all(files.map(async (file, index) => {
      const image = await fileToDataURL(file);
      const baseTitle = titleInput.value.trim() || file.name.replace(/\.[^.]+$/, "") || "本地上传照片";
      return {
        title: files.length > 1 ? `${baseTitle} ${index + 1}` : baseTitle,
        meta: metaInput.value.trim() || "网页端本地上传",
        image,
        local: true
      };
    }));

    localPhotos = [...createdPhotos, ...localPhotos];
    saveLocalPhotos();
    renderPhotos();
    renderCounts();

    input.value = "";
    titleInput.value = "";
    metaInput.value = "";
    tip.textContent = `已添加 ${createdPhotos.length} 张照片。本地保存只在当前浏览器有效。`;
  } catch (error) {
    console.error(error);
    tip.textContent = "图片读取失败，可以换一张体积小一点的图片试试。";
  }
}

function bindUploadPanel() {
  const form = document.querySelector("#photoUploadForm");
  const clearButton = document.querySelector("#clearLocalPhotos");
  const tip = document.querySelector("#uploadTip");

  form.addEventListener("submit", handlePhotoUpload);
  clearButton.addEventListener("click", () => {
    localPhotos = [];
    saveLocalPhotos();
    renderPhotos();
    renderCounts();
    tip.textContent = "已清空当前浏览器里的本地上传照片。";
  });
}

renderGames();
renderPhotos();
renderTools();
renderCounts();
bindUploadPanel();
