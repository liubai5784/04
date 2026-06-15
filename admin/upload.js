const PHOTO_UPLOAD_MAX_BYTES = 850 * 1024;
const PHOTO_UPLOAD_MAX_EDGE = 1600;
let uploadPreviewUrls = [];

function setUploadTip(message) {
  const tip = document.querySelector("#uploadTip");
  if (tip) tip.textContent = message;
}

function makeFileName(file, index) {
  const dot = file.name.lastIndexOf(".");
  const base = dot > 0 ? file.name.slice(0, dot) : `photo-${index + 1}`;
  return `${base}.jpg`;
}

function clearUploadPreview() {
  uploadPreviewUrls.forEach(url => URL.revokeObjectURL(url));
  uploadPreviewUrls = [];

  const drop = document.querySelector("#photoDrop");
  const preview = document.querySelector("#photoPreview");
  if (drop) {
    drop.classList.remove("has-preview");
    drop.style.removeProperty("--upload-preview-image");
  }
  if (preview) {
    preview.innerHTML = "";
    preview.classList.remove("has-preview");
  }
}

function renderUploadPreview(files) {
  const drop = document.querySelector("#photoDrop");
  const preview = document.querySelector("#photoPreview");

  clearUploadPreview();

  const file = files.find(item => item.type.startsWith("image/"));
  if (!file || !drop) return;

  const url = URL.createObjectURL(file);
  uploadPreviewUrls.push(url);
  drop.style.setProperty("--upload-preview-image", `url("${url}")`);
  drop.classList.add("has-preview");

  if (preview) {
    preview.classList.add("has-preview");
    preview.innerHTML = `<img class="upload-preview-image" src="${url}" alt="" />`;
  }
}

async function compressPhoto(file, index) {
  if (!file.type.startsWith("image/")) return null;

  if (file.size <= PHOTO_UPLOAD_MAX_BYTES && file.type !== "image/gif") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_UPLOAD_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let quality = 0.86;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > PHOTO_UPLOAD_MAX_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > PHOTO_UPLOAD_MAX_BYTES) {
    throw new Error(`${file.name} 压缩后仍超过 850KB，请换一张更小的图片。`);
  }

  return new File([blob], makeFileName(file, index), { type: "image/jpeg" });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("图片压缩失败"));
    }, "image/jpeg", quality);
  });
}

async function uploadPhotos(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const input = form.querySelector("#photoInput");
  const submitButton = form.querySelector('button[type="submit"]');
  const title = form.querySelector("#photoTitle")?.value.trim() || "上传照片";
  const meta = form.querySelector("#photoMeta")?.value.trim() || "网页端上传";
  const file = Array.from(input?.files || []).find(item => item.type.startsWith("image/"));

  if (!file) {
    setUploadTip("请先选择要上传的照片。");
    return;
  }

  submitButton.disabled = true;
  setUploadTip("正在上传...");

  try {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("meta", meta);

    const compressed = await compressPhoto(file, 0);
    if (compressed) formData.append("photos", compressed, compressed.name);

    const response = await fetch("/api/photos", {
      method: "POST",
      body: formData
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "上传失败，请检查 D1 绑定和 Pages Functions 部署状态。");
    }

    serverPhotos = data.allPhotos || [];
    renderPhotos();
    renderCounts();
    input.value = "";
    clearUploadPreview();
    setUploadTip("上传成功。");
  } catch (error) {
    console.error(error);
    setUploadTip(`上传失败：${error.message}`);
  } finally {
    submitButton.disabled = false;
  }
}

function bindPhotoUploadForm() {
  const form = document.querySelector("#photoUploadForm");
  if (!form) return;

  const input = form.querySelector("#photoInput");
  input?.addEventListener("change", () => {
    const files = Array.from(input.files || []);
    renderUploadPreview(files);
    if (files.length) setUploadTip("可以上传了。");
  });

  form.addEventListener("submit", uploadPhotos);

  document.querySelector("#clearLocalPhotos")?.addEventListener("click", async () => {
    setUploadTip("正在刷新 D1 照片...");
    await loadServerPhotos();
  });

  window.addEventListener("beforeunload", clearUploadPreview);
}

bindPhotoUploadForm();