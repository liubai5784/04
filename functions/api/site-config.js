const DEFAULT_CONFIG = {
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

export async function onRequestGet(context) {
  const { env } = context;
  const missing = checkBindings(env);
  if (missing) return missing;

  await ensureSchema(env);
  const row = await env.PHOTO_DB.prepare(
    `SELECT value FROM site_config WHERE key = ?`
  ).bind("links").first();

  if (!row?.value) return jsonResponse(DEFAULT_CONFIG);

  try {
    return jsonResponse(normalizeConfig(JSON.parse(row.value)));
  } catch (error) {
    return jsonResponse(DEFAULT_CONFIG);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const missing = checkBindings(env);
  if (missing) return missing;

  await ensureSchema(env);
  const config = normalizeConfig(await request.json().catch(() => DEFAULT_CONFIG));
  const updatedAt = new Date().toISOString();

  await env.PHOTO_DB.prepare(
    `INSERT INTO site_config (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind("links", JSON.stringify(config), updatedAt).run();

  return jsonResponse(config);
}

function normalizeConfig(config) {
  return {
    games: Array.isArray(config?.games) ? config.games.map(normalizeGame).filter(item => item.title) : DEFAULT_CONFIG.games,
    tools: Array.isArray(config?.tools) ? config.tools.map(normalizeTool).filter(item => item.name) : DEFAULT_CONFIG.tools
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

function checkBindings(env) {
  if (!env.PHOTO_DB) {
    return jsonResponse({ error: "D1 绑定 PHOTO_DB 尚未配置。" }, 500);
  }
  return null;
}

async function ensureSchema(env) {
  await env.PHOTO_DB.prepare(
    `CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ).run();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
