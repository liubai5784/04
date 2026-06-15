(() => {
  const STORAGE_KEY = "liubai-personal-status-panel";

  const headlines = [
    "半清醒但还能动",
    "表面冷静，内心加载中",
    "摸鱼欲望正在蓄力",
    "打开文档前的最后准备",
    "精神状态：勉强在线",
    "今天适合慢慢推进",
    "DDL 雷达轻微报警"
  ];

  const summaries = [
    "系统检测到你还没有完全启动，但只要先点开一个页面，就已经比刚才更接近完成了。",
    "当前状态适合做一点不太难的小事：整理目录、改标题、打开文件、写第一行。",
    "今日建议先不要追求完美，先让东西动起来，后面再慢慢修。",
    "如果不想开始，就把任务拆到小到离谱：先做五分钟也算推进。",
    "适合先完成一个最容易的入口任务，给自己一点正反馈。"
  ];

  const skills = [
    "临时抱佛脚",
    "五分钟启动术",
    "复制粘贴整理术",
    "DDL 前夜爆发",
    "截图找灵感",
    "先开文档再说",
    "把复杂事改成小步骤"
  ];

  const debuffs = [
    "打开文档困难",
    "手机吸引力增强",
    "脑袋缓存不足",
    "想法很多但手不动",
    "困意随机刷新",
    "选择困难加重",
    "刚坐下就想休息"
  ];

  const advice = [
    "先做五分钟，剩下的交给惯性。",
    "先把最容易的一项完成，不要从最难的开始。",
    "把任务写成三条以内，今天只盯着下一步。",
    "先保存一个很粗糙的版本，完美以后再说。",
    "喝口水，坐回来，打开文件，写一行。",
    "今天可以慢一点，但不要完全停住。"
  ];

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(list, random) {
    return list[Math.floor(random() * list.length)];
  }

  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getDisplayDate() {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    }).format(new Date());
  }

  function makeStatus(seedText) {
    const random = createRandom(hashString(seedText));
    const energy = Math.round(26 + random() * 62);
    const study = Math.round(18 + random() * 70);
    const slack = Math.round(28 + random() * 66);
    const ddl = Math.round(20 + random() * 76);

    return {
      headline: pick(headlines, random),
      summary: pick(summaries, random),
      skill: pick(skills, random),
      debuff: pick(debuffs, random),
      advice: pick(advice, random),
      meters: { energy, study, slack, ddl }
    };
  }

  function readStoredStatus(todayKey) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      return saved?.date === todayKey ? saved.status : null;
    } catch (error) {
      console.warn("读取个人状态面板失败：", error);
      return null;
    }
  }

  function saveStatus(todayKey, status) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey, status }));
    } catch (error) {
      console.warn("保存个人状态面板失败：", error);
    }
  }

  function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  }

  function renderMeter(name, value) {
    const meter = document.querySelector(`[data-status-meter="${name}"]`);
    if (!meter) return;
    const number = meter.querySelector("strong");
    const bar = meter.querySelector(".meter-track span");
    if (number) number.textContent = `${value}%`;
    if (bar) bar.style.width = `${value}%`;
  }

  function renderStatus(status) {
    setText("#statusHeadline", status.headline);
    setText("#statusSummary", status.summary);
    setText("#statusSkill", status.skill);
    setText("#statusDebuff", status.debuff);
    setText("#statusAdvice", status.advice);
    setText("#statusDate", `${getDisplayDate()} · 今日状态已生成`);

    Object.entries(status.meters).forEach(([name, value]) => renderMeter(name, value));
  }

  function initStatusPanel() {
    const panel = document.querySelector("#status-panel");
    if (!panel) return;

    const todayKey = getTodayKey();
    const initialStatus = readStoredStatus(todayKey) || makeStatus(todayKey);
    saveStatus(todayKey, initialStatus);
    renderStatus(initialStatus);

    document.querySelector("#refreshStatus")?.addEventListener("click", () => {
      const status = makeStatus(`${todayKey}-${Date.now()}`);
      saveStatus(todayKey, status);
      renderStatus(status);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStatusPanel);
  } else {
    initStatusPanel();
  }
})();