const isAdminPage = document.body.dataset.admin === "true";
const CONFIG_STORAGE_KEY = "liubai-gallery-config";

const puzzleGame = {
  title: "照片拼图小游戏",
  desc: "上传一张图片，打乱成九宫格，点击两个碎片交换位置，把照片拼回原样。",
  cover: "assets/images/hero.png",
  tags: ["Puzzle", "照片", "小游戏"],
  url: "games/puzzle.html"
};

const defaultConfig = {
  games: [
    puzzleGame,
    {
      title: "答题练习小程序",
      desc: "适合放概论课、结构力学或英语练习题，后续可以接入你已有的网页小程序。",
      cover: "",
      tags: ["Quiz", "学习", "网页"],
      url: "#"
    },
    {
      title: "错题强化模式",
      desc: "预留给只练错题、答题卡和进度缓存等功能入口。",
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
  ],
  tools: [
    { name: "公式速查", desc: "结构力学、大物、考试前速看公式卡片。", url: "#" },
    { name: "考试急救卡", desc: "临考前按章节整理重点、易错点和题型。", url: "#" },
    { name: "图片提示词库", desc: "保存 Warma、工地、油画风等常用提示词。", url: "#" }
  ]
};

const defaultPhotos = [
  { title: "Warma 图片区", meta: "角色图 / 换装 / 场景", image: "" },
  { title: "工地项目图", meta: "桥墩 / 吊机 / 构件", image: "" },
  { title: "油画风作品", meta: "风格化图像", image: "" },
  { title: "日出光线系列", meta: "光影统一 / 场景替换", image: "" },
  { title: "视频提示词画面", meta: "14:5 / 动态构图", image: "" }
];

let siteConfig = structuredClone(defaultConfig);
let serverPhotos = [];

function getAllPhotos() {
  return [...serverPhotos, ...defaultPhotos];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function parseTags(value) {
  return String(value || "")
    .split(/[,，]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}

function createPlaceholder(label, className = "") {
  return `<div class="image-placeholder ${className}"><span>${escapeHtml(label)}</span></div>`;
}

function ensurePuzzleGame(config) {
  const normalized = {
    games: Array.isArray(config?.games) ? config.games : defaultConfig.games,
    tools: Array.isArray(config?.tools) ? config.tools : defaultConfig.tools
  };
  const hasPuzzle = normalized.games.some(item => item?.url === puzzleGame.url || item?.title === puzzleGame.title);
  return hasPuzzle ? normalized : { ...normalized, games: [puzzleGame, ...normalized.games] };
}

function normalizeConfig(config) {
  return ensurePuzzleGame(config);
}

function readLocalConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw ? normalizeConfig(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn("读取本地配置失败：", error);
    return null;
  }
}

function writeLocalConfig(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
}

async function loadSiteConfig() {
  const localConfig = readLocalConfig();
  if (localConfig) siteConfig = localConfig;

  try {
    const response = await fetch("/api/site-config");
    if (!response.ok) throw new Error("配置接口不可用");
    siteConfig = normalizeConfig(await response.json());
    writeLocalConfig(siteConfig);
    setConfigStatus("已连接站点配置接口。");
  } catch (error) {
    if (!localConfig) siteConfig = structuredClone(defaultConfig);
    siteConfig = normalizeConfig(siteConfig);
    writeLocalConfig(siteConfig);
    setConfigStatus("当前使用浏览器本地配置；部署到 Cloudflare 并绑定 D1 后会同步到站点配置。");
  }
}

async function saveSiteConfig(config) {
  siteConfig = normalizeConfig(config);
  writeLocalConfig(siteConfig);

  try {
    const response = await fetch("/api/site-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(siteConfig)
    });
    if (!response.ok) throw new Error("配置接口保存失败");
    siteConfig = normalizeConfig(await response.json());
    writeLocalConfig(siteConfig);
    setConfigStatus("已保存到站点配置。");
  } catch (error) {
    setConfigStatus("已保存到当前浏览器；部署到 Cloudflare 并绑定 D1 后可保存到站点配置。");
  }

  renderGames();
  renderTools();
  renderNavMenus();
  bindDisabledLinks();
  renderLinkEditors();
}

function setConfigStatus(message) {
  const status = document.querySelector("#configTip");
  if (status) status.textContent = message;
}

function renderGames() {
  const grid = document.querySelector("#gamesGrid");
  if (!grid) return;

  grid.innerHTML = siteConfig.games.map(item => `
    <article class="project-card">
      ${item.cover ? `<img class="card-cover" src="${escapeAttribute(item.cover)}" alt="${escapeAttribute(item.title)}">` : createPlaceholder("游戏封面占位", "card-cover")}
      <div class="card-body">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.desc)}</p>
        <div class="tag-row">${(item.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        ${renderOpenLink(item.url, "打开作品")}
      </div>
    </article>
  `).join("");
}

function renderNavMenus() {
  const gamesMenu = document.querySelector("#gamesMenu");
  const toolsMenu = document.querySelector("#toolsMenu");

  if (gamesMenu) {
    gamesMenu.innerHTML = [
      `<a href="#games">查看全部小游戏</a>`,
      ...siteConfig.games.map(item => renderNavMenuLink(item.title, item.url))
    ].join("");
  }

  if (toolsMenu) {
    toolsMenu.innerHTML = [
      `<a href="#tools">查看全部工具</a>`,
      ...siteConfig.tools.map(item => renderNavMenuLink(item.name, item.url))
    ].join("");
  }
}

function renderNavMenuLink(label, url) {
  const safeUrl = String(url || "#").trim() || "#";
  const disabled = safeUrl === "#";
  return `<a class="${disabled ? "is-disabled" : ""}" href="${escapeAttribute(safeUrl)}" ${disabled ? "aria-disabled=\"true\"" : "target=\"_blank\" rel=\"noopener\""}>${escapeHtml(label || "未命名入口")}</a>`;
}

function renderOpenLink(url, label = "打开 →") {
  const safeUrl = String(url || "#").trim() || "#";
  const disabled = safeUrl === "#";
  return `<a class="tool-link ${disabled ? "is-disabled" : ""}" href="${escapeAttribute(safeUrl)}" ${disabled ? "aria-disabled=\"true\"" : "target=\"_blank\" rel=\"noopener\""}>${escapeHtml(label)} →</a>`;
}

function renderPhotos() {
  const grid = document.querySelector("#galleryGrid");
  if (!grid) return;

  const photos = getAllPhotos();
  grid.innerHTML = photos.map(item => {
    const imageMarkup = item.image
      ? `<button class="photo-open" type="button" data-image="${escapeAttribute(item.image)}" data-title="${escapeAttribute(item.title)}" data-meta="${escapeAttribute(item.meta || "")}" aria-label="查看大图：${escapeAttribute(item.title)}">
          <img class="photo-image" src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.title)}" loading="lazy">
        </button>`
      : `<div class="photo-empty"></div>`;
    const removeButton = isAdminPage && item.id
      ? `<button class="photo-remove" type="button" data-id="${escapeAttribute(item.id)}" title="删除这张照片">×</button>`
      : "";

    return `
      <article class="photo-card ${item.image ? "has-image" : "image-placeholder"}">
        ${imageMarkup}
        ${removeButton}
        <div class="photo-title">${escapeHtml(item.title)}<span class="photo-meta">${escapeHtml(item.meta || "")}</span></div>
      </article>
    `;
  }).join("");

  bindPhotoOpenButtons();
  if (isAdminPage) bindPhotoRemoveButtons();
}

function bindPhotoOpenButtons() {
  document.querySelectorAll(".photo-open").forEach(button => {
    button.addEventListener("click", () => {
      openLightbox({
        image: button.dataset.image,
        title: button.dataset.title,
        meta: button.dataset.meta
      });
    });
  });
}

function ensureLightbox() {
  let lightbox = document.querySelector("#photoLightbox");
  if (lightbox) return lightbox;

  lightbox = document.createElement("div");
  lightbox.id = "photoLightbox";
  lightbox.className = "lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <button class="lightbox-backdrop" type="button" aria-label="关闭大图"></button>
    <figure class="lightbox-panel">
      <button class="lightbox-close" type="button" aria-label="关闭大图">×</button>
      <img class="lightbox-image" alt="">
      <figcaption class="lightbox-caption">
        <strong></strong>
        <span></span>
      </figcaption>
    </figure>
  `;
  document.body.append(lightbox);

  lightbox.querySelector(".lightbox-backdrop").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  return lightbox;
}

function openLightbox({ image, title, meta }) {
  if (!image) return;

  const lightbox = ensureLightbox();
  const img = lightbox.querySelector(".lightbox-image");
  const captionTitle = lightbox.querySelector(".lightbox-caption strong");
  const captionMeta = lightbox.querySelector(".lightbox-caption span");

  img.src = image;
  img.alt = title || "照片作品";
  captionTitle.textContent = title || "照片作品";
  captionMeta.textContent = meta || "";
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  const lightbox = document.querySelector("#photoLightbox");
  if (!lightbox) return;

  lightbox.hidden = true;
  lightbox.querySelector(".lightbox-image").removeAttribute("src");
  document.body.classList.remove("lightbox-open");
}

function bindPhotoRemoveButtons() {
  document.querySelectorAll(".photo-remove").forEach(button => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const tip = document.querySelector("#uploadTip");

      try {
        const response = await fetch(`/api/photos/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!response.ok) throw new Error("删除失败");

        const data = await response.json();
        serverPhotos = data.allPhotos || [];
        renderPhotos();
        renderCounts();
        if (tip) tip.textContent = "已从 D1 数据库删除这张照片。";
      } catch (error) {
        console.error(error);
        if (tip) tip.textContent = "删除失败：请确认 Cloudflare Pages 已绑定 D1 数据库 PHOTO_DB。";
      }
    });
  });
}

function renderTools() {
  const list = document.querySelector("#toolList");
  if (!list) return;

  list.innerHTML = siteConfig.tools.map((item, index) => `
    <article class="tool-item">
      <div class="tool-index">${String(index + 1).padStart(2, "0")}</div>
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.desc)}</p>
      </div>
      ${renderOpenLink(item.url)}
    </article>
  `).join("");
}

function renderCounts() {
  const gameCount = document.querySelector("#gameCount");
  const photoCount = document.querySelector("#photoCount");
  const toolCount = document.querySelector("#toolCount");

  if (gameCount) gameCount.textContent = siteConfig.games.length;
  if (photoCount) photoCount.textContent = getAllPhotos().length;
  if (toolCount) toolCount.textContent = siteConfig.tools.length;
}

async function loadServerPhotos() {
  const tip = document.querySelector("#uploadTip");

  try {
    const response = await fetch("/api/photos");
    if (!response.ok) throw new Error("接口不可用");

    serverPhotos = await response.json();
    if (tip) tip.textContent = "Cloudflare D1 已连接：上传照片会保存到数据库。";
  } catch (error) {
    console.warn("Cloudflare D1 接口未连接：", error);
    serverPhotos = [];
    if (tip) tip.textContent = "照片云端接口暂不可用：部署到 Cloudflare Pages 后，请绑定 D1，变量名为 PHOTO_DB。";
  }

  renderPhotos();
  renderCounts();
}

function bindDisabledLinks() {
  document.querySelectorAll("a.is-disabled").forEach(link => {
    link.addEventListener("click", event => event.preventDefault());
  });
}

async function initSite() {
  await loadSiteConfig();
  renderGames();
  renderPhotos();
  renderTools();
  renderCounts();
  renderNavMenus();
  bindDisabledLinks();
  loadServerPhotos();
}

initSite();
