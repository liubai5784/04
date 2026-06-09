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

function ensureProjectFiles() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(photosFile)) fs.writeFileSync(photosFile, "[]", "utf-8");
}

function readPhotos() {
  ensureProjectFiles();
  try {
    return JSON.parse(fs.readFileSync(photosFile, "utf-8"));
  } catch (error) {
    return [];
  }
}

function writePhotos(photos) {
  ensureProjectFiles();
  fs.writeFileSync(photosFile, JSON.stringify(photos, null, 2), "utf-8");
}

ensureProjectFiles();

app.use(cors());
app.use(express.json());
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
      cb(new Error("只支持上传图片文件"));
      return;
    }
    cb(null, true);
  }
});

app.get("/api/photos", (_req, res) => {
  res.json(readPhotos());
});

app.post("/api/photos", upload.array("photos", 20), (req, res) => {
  const title = (req.body.title || "上传照片").trim();
  const meta = (req.body.meta || "网页端后端上传").trim();
  const currentPhotos = readPhotos();
  const createdPhotos = (req.files || []).map((file, index) => ({
    id: `${Date.now()}-${index}`,
    title: req.files.length > 1 ? `${title} ${index + 1}` : title,
    meta,
    image: `/uploads/${file.filename}`,
    uploadedAt: new Date().toISOString()
  }));

  const nextPhotos = [...createdPhotos, ...currentPhotos];
  writePhotos(nextPhotos);
  res.json({ photos: createdPhotos, allPhotos: nextPhotos });
});

app.delete("/api/photos/:id", (req, res) => {
  const photos = readPhotos();
  const target = photos.find(photo => photo.id === req.params.id);
  const nextPhotos = photos.filter(photo => photo.id !== req.params.id);

  if (target && target.image && target.image.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, target.image);
    fs.unlink(filePath, () => {});
  }

  writePhotos(nextPhotos);
  res.json({ ok: true, allPhotos: nextPhotos });
});

app.listen(PORT, () => {
  console.log(`作品空间后端已启动：http://localhost:${PORT}`);
});
