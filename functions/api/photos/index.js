export async function onRequestGet(context) {
  const { env } = context;
  const missing = checkBindings(env);
  if (missing) return missing;

  await ensureSchema(env);

  const { results } = await env.PHOTO_DB.prepare(
    `SELECT id, file_key AS key, title, meta, size, type, created_at AS createdAt
     FROM photos
     ORDER BY created_at DESC`
  ).all();

  const photos = results.map(row => ({
    ...row,
    image: `/api/photo-file?key=${encodeURIComponent(row.key)}`
  }));

  return jsonResponse(photos);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const missing = checkBindings(env);
  if (missing) return missing;

  await ensureSchema(env);

  const formData = await request.formData();
  const files = formData.getAll("photos").filter(item => item instanceof File);
  const title = String(formData.get("title") || "上传照片").trim();
  const meta = String(formData.get("meta") || "网页端上传").trim();

  if (!files.length) {
    return jsonResponse({ error: "No photos uploaded." }, 400);
  }

  const created = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const ext = getExtension(file.name, file.type);
    const id = crypto.randomUUID();
    const key = `photos/${Date.now()}-${id}.${ext}`;
    const createdAt = new Date().toISOString();

    await env.PHOTO_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream"
      }
    });

    await env.PHOTO_DB.prepare(
      `INSERT INTO photos (id, file_key, title, meta, size, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, key, title, meta, file.size, file.type, createdAt).run();

    created.push({
      id,
      key,
      title,
      meta,
      image: `/api/photo-file?key=${encodeURIComponent(key)}`,
      size: file.size,
      type: file.type,
      createdAt
    });
  }

  const { results } = await env.PHOTO_DB.prepare(
    `SELECT id, file_key AS key, title, meta, size, type, created_at AS createdAt
     FROM photos
     ORDER BY created_at DESC`
  ).all();

  const allPhotos = results.map(row => ({
    ...row,
    image: `/api/photo-file?key=${encodeURIComponent(row.key)}`
  }));

  return jsonResponse({ created, allPhotos });
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

function getExtension(filename, type) {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
