const board = document.querySelector("#puzzleBoard");
const preview = document.querySelector("#puzzlePreview");
const input = document.querySelector("#puzzleImageInput");
const shuffleButton = document.querySelector("#shufflePuzzle");
const resetButton = document.querySelector("#resetPuzzle");
const tip = document.querySelector("#puzzleTip");
const moveCountEl = document.querySelector("#moveCount");
const statusEl = document.querySelector("#puzzleStatus");

const defaultImage = "../assets/images/hero.png";
const size = 3;
let imageUrl = defaultImage;
let tiles = [];
let selectedIndex = null;
let moveCount = 0;

function createSolvedTiles() {
  return Array.from({ length: size * size }, (_, index) => index);
}

function shuffleTiles() {
  const shuffled = createSolvedTiles();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.every((value, index) => value === index)) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  tiles = shuffled;
  selectedIndex = null;
  moveCount = 0;
  renderPuzzle();
}

function renderPuzzle() {
  board.innerHTML = tiles.map((tile, index) => {
    const row = Math.floor(tile / size);
    const col = tile % size;
    const isSelected = selectedIndex === index;
    return `
      <button class="puzzle-tile ${isSelected ? "is-selected" : ""}" type="button" data-index="${index}" style="background-image: url('${imageUrl}'); background-position: ${col * 50}% ${row * 50}%;"></button>
    `;
  }).join("");

  preview.style.backgroundImage = `url('${imageUrl}')`;
  moveCountEl.textContent = moveCount;
  statusEl.textContent = isSolved() ? "完成" : "未完成";
  tip.textContent = isSolved() ? "拼图完成！可以换一张图继续玩。" : "点击两个碎片可以交换位置。";

  board.querySelectorAll(".puzzle-tile").forEach(button => {
    button.addEventListener("click", () => handleTileClick(Number(button.dataset.index)));
  });
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

  [tiles[selectedIndex], tiles[index]] = [tiles[index], tiles[selectedIndex]];
  selectedIndex = null;
  moveCount += 1;
  renderPuzzle();
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
  imageUrl = URL.createObjectURL(file);
  shuffleTiles();
});

shuffleButton.addEventListener("click", shuffleTiles);
resetButton.addEventListener("click", () => {
  if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
  imageUrl = defaultImage;
  shuffleTiles();
});

shuffleTiles();
