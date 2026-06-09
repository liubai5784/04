export async function onRequestDelete(context) {
  const { params, env } = context;

  const missing = checkBindings(env);
  if (missing) return missing;

  await ensureSchema(env);

  const id = params.id;
  const target = await env.PHOTO_DB.prepare(
    `SELECT id, file_key AS key FROM photos WHERE id = ?`
  ).bind(id).first();

  if (!target) {
    return jsonResponse({ error: "Photo not found." }, 404);
  }

  await env.PHOTO_BUCKET.delete(target.key);
  await env.PHOTO_DB.prepare(`DELETE FROM photos WHERE id = ?`).bind(id).run();

  const { results } = await env.PHOTO_DB.prepare(
    `SELECT id, file_key AS key, title, meta, size, type, created_at AS createdAt
     FROM photos
     ORDER BY created_at DESC`
  ).all();

  const allPhotos = results.map(row => ({
    ...row,
    image: `/api/photo-file?key=${encodeURIComponent(row.key)}`
  }));

  return jsonResponse({ deleted: id, allPhotos });
}

function checkBindings(env) {
  if (!env.PHOTO_BUCKET) {
    return jsonResponse({ error: "R2 binding PHOTO_BUCKET is not configured." }, 500);
  }
  if (!env.PHOTO_DB) {
    return jsonResponse({ error: "D1 binding PHOTO_DB is not configured." }, 500);
  }
  return null;
}

async function ensureSchema(env) {
  await env.PHOTO_DB.prepare(
    `CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      file_key TEXT NOT NULL,
      title TEXT NOT NULL,
      meta TEXT,
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
