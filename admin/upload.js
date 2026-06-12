const PHOTO_UPLOAD_MAX_BYTES = 850 * 1024;
const PHOTO_UPLOAD_MAX_EDGE = 1600;

function setUploadTip(message) {
  const tip = document.querySelector("#uploadTip");
  if (tip) tip.textContent = message;
}

function makeFileName(file, index) {
  const dot = file.name.lastIndexOf(".");
  const base = dot > 0 ? file.name.slice(0, dot) : `photo-${index + 1}`;
  return `${base}.jpg`;
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
  const files = Array.from(input?.files || []);

  if (!files.length) {
    setUploadTip("请先选择要上传的照片。");
    return;
  }

  submitButton.disabled = true;
  setUploadTip(`正在压缩并上传 ${files.length} 张照片...`);

  try {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("meta", meta);

    for (let i = 0; i < files.length; i += 1) {
      const compressed = await compressPhoto(files[i], i);
      if (compressed) formData.append("photos", compressed, compressed.name);
    }

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
    setUploadTip(`上传成功：${data.created?.length || files.length} 张照片已加入照片墙。`);
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

  form.addEventListener("submit", uploadPhotos);

  document.querySelector("#clearLocalPhotos")?.addEventListener("click", async () => {
    setUploadTip("正在刷新 D1 照片...");
    await loadServerPhotos();
  });
}

bindPhotoUploadForm();
