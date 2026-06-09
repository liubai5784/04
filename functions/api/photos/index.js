export async function onRequestGet(context) {
  const { env } = context;

  if (!env.PHOTO_BUCKET) {
    return jsonResponse({ error: "R2 binding PHOTO_BUCKET is not configured." }, 500);
  }

  const photos = await loadPhotoList(env);
  return jsonResponse(photos);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.PHOTO_BUCKET) {
    return jsonResponse({ error: "R2 binding PHOTO_BUCKET is not configured." }, 500);
  }

  const formData = await request.formData();
  const files = formData.getAll("photos").filter(item => item instanceof File);
  const title = String(formData.get("title") || "上传照片").trim();
  const meta = String(formData.get("meta") || "网页端上传").trim();

  if (!files.length) {
    return jsonResponse({ error: "No photos uploaded." }, 400);
  }

  const photos = await loadPhotoList(env);
  const created = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const ext = getExtension(file.name, file.type);
    const id = crypto.randomUUID();
    const key = `photos/${Date.now()}-${id}.${ext}`;

    await env.PHOTO_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream"
      }
    });

    const item = {
      id,
      key,
      title,
      meta,
      image: `/api/photo-file?key=${encodeURIComponent(key)}`,
      size: file.size,
      type: file.type,
      createdAt: new Date().toISOString()
    };

    photos.unshift(item);
    created.push(item);
  }

  await savePhotoList(env, photos);
  return jsonResponse({ created, allPhotos: photos });
}

async function loadPhotoList(env) {
  const object = await env.PHOTO_BUCKET.get("data/photos.json");
  if (!object) return [];

  try {
    return await object.json();
  } catch {
    return [];
  }
}

async function savePhotoList(env, photos) {
  await env.PHOTO_BUCKET.put("data/photos.json", JSON.stringify(photos, null, 2), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8"
    }
  });
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
