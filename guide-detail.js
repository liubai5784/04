(() => {
  const guideItems = {
    games: {
      label: "Game Collection",
      title: "小游戏合集",
      desc: "这里集中放练习用和实验性质的小游戏。先在这里看入口说明，再点详细信息进入小游戏区域。",
      cardTitle: "小游戏入口说明",
      cardDesc: "包含轻坦快跑、照片拼图和后续预留的互动小游戏。",
      tags: ["小游戏", "跑酷", "拼图"],
      target: "#games"
    },
    gallery: {
      label: "Image Gallery",
      title: "生成照片 / 作品墙",
      desc: "这里是 Warma 图片、油画风作品、光影系列等图片内容。先展开说明，再进入作品墙。",
      cardTitle: "照片区入口说明",
      cardDesc: "点击详细信息后会跳到下面的图片作品墙。",
      tags: ["Warma", "图片", "作品墙"],
      target: "#gallery"
    },
    tools: {
      label: "Tool Box",
      title: "学习工具箱",
      desc: "这里放 ChatGPT、Cloudflare、GitHub 等常用工具入口。先查看说明，再进入工具列表。",
      cardTitle: "工具入口说明",
      cardDesc: "用于快速打开学习、部署和代码管理相关工具。",
      tags: ["工具", "学习", "管理"],
      target: "#tools"
    },
    admin: {
      label: "Admin Panel",
      title: "后台管理",
      desc: "这里用于管理入口、上传照片和维护网站内容。为了避免误点，先显示说明，再进入后台。",
      cardTitle: "后台入口说明",
      cardDesc: "点击详细信息后会进入后台页面。",
      tags: ["后台", "上传", "管理"],
      target: "admin/index.html#links"
    }
  };

  function getPanel() {
    return document.querySelector("#guideDetail");
  }

  function escapeText(value) {
    return String(value || "");
  }

  function showGuide(key) {
    const item = guideItems[key];
    const panel = getPanel();
    if (!item || !panel) return;

    panel.classList.remove("is-hidden");
    panel.innerHTML = `
      <div class="guide-detail-main">
        <p class="guide-detail-label">${escapeText(item.label)}</p>
        <h2>${escapeText(item.title)}</h2>
        <p class="guide-detail-desc">${escapeText(item.desc)}</p>
        <div class="guide-detail-actions">
          <a class="btn primary" href="${item.target}">详细信息 →</a>
          <button class="btn ghost guide-close" type="button">先不跳转</button>
        </div>
      </div>
      <aside class="guide-detail-card">
        <strong>${escapeText(item.cardTitle)}</strong>
        <p>${escapeText(item.cardDesc)}</p>
        <div class="guide-detail-tags">${item.tags.map(tag => `<span>${escapeText(tag)}</span>`).join("")}</div>
      </aside>
    `;

    const closeButton = panel.querySelector(".guide-close");
    closeButton?.addEventListener("click", () => panel.classList.add("is-hidden"));

    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindGuideTriggers() {
    document.querySelectorAll("[data-guide-target]").forEach(link => {
      link.addEventListener("click", event => {
        const key = link.dataset.guideTarget;
        if (!guideItems[key]) return;
        event.preventDefault();
        showGuide(key);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", bindGuideTriggers);
})();
