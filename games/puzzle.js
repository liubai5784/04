const board = document.querySelector("#puzzleBoard");
const preview = document.querySelector("#puzzlePreview");
const input = document.querySelector("#puzzleImageInput");
const shuffleButton = document.querySelector("#shufflePuzzle");
const resetButton = document.querySelector("#resetPuzzle");
const useGalleryButton = document.querySelector("#useGalleryPhoto");
const tip = document.querySelector("#puzzleTip");
const moveCountEl = document.querySelector("#moveCount");
const statusEl = document.querySelector("#puzzleStatus");
const colsInput = document.querySelector("#puzzleCols");
const rowsInput = document.querySelector("#puzzleRows");
const applyGridButton = document.querySelector("#applyPuzzleGrid");

const defaultImage = "../assets/images/hero.png";
let cols = 3;
let rows = 3;
let imageUrl = defaultImage;
let imageRatio = 16 / 9;
let imageLabel = "默认主视觉图";
let tiles = [];
let selectedIndex = null;
let moveCount = 0;
let dragIndex = null;
let galleryPhotos = [];
let galleryIndex = -1;

function clampGridValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 3;
  return Math.min(8, Math.max(2, Math.round(number)));
}

function syncGridFromInputs() {
  cols = clampGridValue(colsInput.value);
  rows = clampGridValue(rowsInput.value);
  colsInput.value = cols;
  rowsInput.value = rows;
}

function createSolvedTiles() {
  return Array.from({ length: rows * cols }, (_, index) => index);
}

function loadImageRatio(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 1);
    img.onerror = () => resolve(16 / 9);
    img.src = src;
  });
}

function getPhotoImage(item) {
  return String(item?.image || item?.imageUrl || item?.image_url || item?.url || item?.src || "").trim();
}

async function loadGalleryPhotos() {
  try {
    const response = await fetch("/api/photos", { cache: "no-store" });
    if (!response.ok) throw new Error("照片墙接口不可用");
    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.allPhotos || data.photos || []);
    galleryPhotos = list
      .map(item => ({
        title: String(item?.title || "照片墙图片").trim() || "照片墙图片",
        image: getPhotoImage(item)
      }))
      .filter(item => item.image);
  } catch (error) {
    console.warn("读取照片墙图片失败：", error);
    galleryPhotos = [];
  }

  if (useGalleryButton) {
    useGalleryButton.disabled = galleryPhotos.length === 0;
    useGalleryButton.textContent = galleryPhotos.length ? "换一张照片墙图片" : "照片墙暂无图片";
  }

  return galleryPhotos;
}

async function setImage(src, label = "照片") {
  imageUrl = src;
  imageLabel = label;
  imageRatio = await loadImageRatio(src);
  board.style.aspectRatio = String(imageRatio);
  preview.style.aspectRatio = String(imageRatio);
  shuffleTiles();
}

function useGalleryPhoto(step = 1) {
  if (!galleryPhotos.length) {
    tip.textContent = "照片墙暂时没有可用图片，可以先选择本地图片。";
    return;
  }

  galleryIndex = (galleryIndex + step + galleryPhotos.length) % galleryPhotos.length;
  const photo = galleryPhotos[galleryIndex];
  setImage(photo.image, photo.title || "照片墙图片");
}

function shuffleTiles() {
  const shuffled = createSolvedTiles();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.length > 1 && shuffled.every((value, index) => value === index)) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  tiles = shuffled;
  selectedIndex = null;
  dragIndex = null;
  moveCount = 0;
  renderPuzzle();
}

function renderPuzzle() {
  board.style.aspectRatio = String(imageRatio);
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  preview.style.aspectRatio = String(imageRatio);

  const xStep = cols === 1 ? 0 : 100 / (cols - 1);
  const yStep = rows === 1 ? 0 : 100 / (rows - 1);

  board.innerHTML = tiles.map((tile, index) => {
    const row = Math.floor(tile / cols);
    const col = tile % cols;
    const isSelected = selectedIndex === index;
    return `
      <button class="puzzle-tile ${isSelected ? "is-selected" : ""}" type="button" draggable="true" data-index="${index}" style="background-image: url('${imageUrl}'); background-size: ${cols * 100}% ${rows * 100}%; background-position: ${col * xStep}% ${row * yStep}%;"></button>
    `;
  }).join("");

  preview.style.backgroundImage = `url('${imageUrl}')`;
  moveCountEl.textContent = moveCount;
  statusEl.textContent = isSolved() ? "完成" : "未完成";
  tip.textContent = isSolved()
    ? "拼图完成！可以换一张图继续玩。"
    : `当前图片：${imageLabel}。横向 ${cols} 块，纵向 ${rows} 块。`;

  board.querySelectorAll(".puzzle-tile").forEach(button => {
    button.addEventListener("click", () => handleTileClick(Number(button.dataset.index)));
    button.addEventListener("dragstart", event => handleDragStart(event, Number(button.dataset.index)));
    button.addEventListener("dragover", event => event.preventDefault());
    button.addEventListener("drop", event => handleDrop(event, Number(button.dataset.index)));
    button.addEventListener("dragend", handleDragEnd);
  });
}

function swapTiles(fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex == null || toIndex == null) return;
  [tiles[fromIndex], tiles[toIndex]] = [tiles[toIndex], tiles[fromIndex]];
  selectedIndex = null;
  dragIndex = null;
  moveCount += 1;
  renderPuzzle();
}

function handleTileClick(index) {
  if (selectedIndex === null) {
    selectedIndex = index;
    renderPuzzle();
    return;
  }

  if (selectedIndex === index) {
    selectedIndex = null;
    renderPuzzle();
    return;
  }

  swapTiles(selectedIndex, index);
}

function handleDragStart(event, index) {
  dragIndex = index;
  selectedIndex = index;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(index));
  requestAnimationFrame(() => event.target.classList.add("is-dragging"));
}

function handleDrop(event, targetIndex) {
  event.preventDefault();
  const sourceIndex = Number(event.dataTransfer.getData("text/plain"));
  swapTiles(Number.isFinite(sourceIndex) ? sourceIndex : dragIndex, targetIndex);
}

function handleDragEnd(event) {
  event.target.classList.remove("is-dragging");
  dragIndex = null;
}

function isSolved() {
  return tiles.every((value, index) => value === index);
}

input.addEventListener("change", () => {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    tip.textContent = "请选择图片文件。";
    return;
  }

  if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
  setImage(URL.createObjectURL(file), file.name || "本地图片");
});

useGalleryButton?.addEventListener("click", () => useGalleryPhoto(1));

applyGridButton.addEventListener("click", () => {
  syncGridFromInputs();
  shuffleTiles();
});

colsInput.addEventListener("change", () => {
  syncGridFromInputs();
});

rowsInput.addEventListener("change", () => {
  syncGridFromInputs();
});

shuffleButton.addEventListener("click", shuffleTiles);
resetButton.addEventListener("click", () => {
  if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
  setImage(defaultImage, "默认主视觉图");
});

async function initPuzzle() {
  syncGridFromInputs();
  const photos = await loadGalleryPhotos();
  if (photos.length) {
    galleryIndex = 0;
    await setImage(photos[0].image, photos[0].title || "照片墙图片");
  } else {
    await setImage(defaultImage, "默认主视觉图");
  }
}

initPuzzle();