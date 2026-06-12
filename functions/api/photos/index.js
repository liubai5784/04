export async function onRequestGet(context) {
  const { env } = context;
  const db = getPhotoDB(env);
  if (!db) return missingBindingResponse();

  await ensureSchema(db);

  const { results } = await db.prepare(
    `SELECT id, title, meta, image_data AS image, size, type, created_at AS createdAt
     FROM photos
     ORDER BY created_at DESC`
  ).all();

  return jsonResponse(results || []);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getPhotoDB(env);
  if (!db) return missingBindingResponse();

  await ensureSchema(db);

  const formData = await request.formData();
  const files = formData.getAll("photos").filter(item => item instanceof File);
  const title = String(formData.get("title") || "上传照片").trim();
  const meta = String(formData.get("meta") || "网页端上传").trim();

  if (!files.length) {
    return jsonResponse({ error: "没有收到照片文件。" }, 400);
  }

  const created = [];
  const maxBytes = 900 * 1024;

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    if (file.size > maxBytes) {
      return jsonResponse({ error: `图片 ${file.name} 太大，请先压缩到 900KB 以内。` }, 413);
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const imageData = await fileToDataUrl(file);

    await db.prepare(
      `INSERT INTO photos (id, title, meta, image_data, size, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, title, meta, imageData, file.size, file.type, createdAt).run();

    created.push({
      id,
      title,
      meta,
      image: imageData,
      size: file.size,
      type: file.type,
      createdAt
    });
  }

  const { results } = await db.prepare(
    `SELECT id, title, meta, image_data AS image, size, type, created_at AS createdAt
     FROM photos
     ORDER BY created_at DESC`
  ).all();

  return jsonResponse({ created, allPhotos: results || [] });
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

async function fileToDataUrl(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return `data:${file.type || "image/jpeg"};base64,${btoa(binary)}`;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
