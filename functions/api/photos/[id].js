export async function onRequestDelete(context) {
  const { params, env } = context;

  const db = getPhotoDB(env);
  if (!db) return missingBindingResponse();

  await ensureSchema(db);

  const id = params.id;
  const target = await db.prepare(
    `SELECT id FROM photos WHERE id = ?`
  ).bind(id).first();

  if (!target) {
    return jsonResponse({ error: "Photo not found." }, 404);
  }

  await db.prepare(`DELETE FROM photos WHERE id = ?`).bind(id).run();

  const { results } = await db.prepare(
    `SELECT id, title, meta, image_data AS image, size, type, created_at AS createdAt
     FROM photos
     ORDER BY created_at DESC`
  ).all();

  return jsonResponse({ deleted: id, allPhotos: results || [] });
}

function getPhotoDB(env) {
  return env.PHOTO_DB || env.CESHI03 || env.ceshi03 || env.DB || null;
}

function missingBindingResponse() {
  return jsonResponse({ error: "D1 绑定未配置，请绑定 PHOTO_DB、CESHI03 或 DB。" }, 500);
}

async function ensureSchema(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      meta TEXT,
      image_data TEXT NOT NULL,
      size INTEGER,
      type TEXT,
      created_at TEXT NOT NULL
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
