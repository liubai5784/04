const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
const photosFile = path.join(dataDir, "photos.json");
const configFile = path.join(dataDir, "site-config.json");

const defaultConfig = {
  games: [
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

function ensureProjectFiles() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(photosFile)) fs.writeFileSync(photosFile, "[]", "utf-8");
  if (!fs.existsSync(configFile)) fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2), "utf-8");
}

function readJson(file, fallback) {
  ensureProjectFiles();
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (error) {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureProjectFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function normalizeConfig(config) {
  return {
    games: Array.isArray(config?.games) ? config.games.map(normalizeGame).filter(item => item.title) : defaultConfig.games,
    tools: Array.isArray(config?.tools) ? config.tools.map(normalizeTool).filter(item => item.name) : defaultConfig.tools
  };
}

function normalizeGame(item) {
  return {
    title: String(item?.title || "").trim(),
    desc: String(item?.desc || "").trim(),
    cover: String(item?.cover || "").trim(),
    tags: Array.isArray(item?.tags) ? item.tags.map(tag => String(tag).trim()).filter(Boolean) : [],
    url: String(item?.url || "#").trim() || "#"
  };
}

function normalizeTool(item) {
  return {
    name: String(item?.name || "").trim(),
    desc: String(item?.desc || "").trim(),
    url: String(item?.url || "#").trim() || "#"
  };
}

ensureProjectFiles();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_\u4e00-\u9fa5]/g, "-");
    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("只支持上传图片文件。"));
      return;
    }
    cb(null, true);
  }
});

app.get("/api/site-config", (_req, res) => {
  res.json(normalizeConfig(readJson(configFile, defaultConfig)));
});

app.post("/api/site-config", (req, res) => {
  const config = normalizeConfig(req.body);
  writeJson(configFile, config);
  res.json(config);
});

app.get("/api/photos", (_req, res) => {
  res.json(readJson(photosFile, []));
});

app.post("/api/photos", upload.array("photos", 20), (req, res) => {
  const title = (req.body.title || "上传照片").trim();
  const meta = (req.body.meta || "网页端本地上传").trim();
  const currentPhotos = readJson(photosFile, []);
  const createdPhotos = (req.files || []).map((file, index) => ({
    id: `${Date.now()}-${index}`,
    title: req.files.length > 1 ? `${title} ${index + 1}` : title,
    meta,
    image: `/uploads/${file.filename}`,
    uploadedAt: new Date().toISOString()
  }));

  const nextPhotos = [...createdPhotos, ...currentPhotos];
  writeJson(photosFile, nextPhotos);
  res.json({ photos: createdPhotos, allPhotos: nextPhotos });
});

app.delete("/api/photos/:id", (req, res) => {
  const photos = readJson(photosFile, []);
  const target = photos.find(photo => photo.id === req.params.id);
  const nextPhotos = photos.filter(photo => photo.id !== req.params.id);

  if (target && target.image && target.image.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, target.image);
    fs.unlink(filePath, () => {});
  }

  writeJson(photosFile, nextPhotos);
  res.json({ ok: true, allPhotos: nextPhotos });
});

app.listen(PORT, () => {
  console.log(`本地作品空间服务器已启动：http://localhost:${PORT}`);
  console.log("正式部署仍使用 Cloudflare Pages Functions + D1。");
});
