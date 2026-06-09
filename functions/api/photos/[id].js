export async function onRequestDelete(context) {
  const { params, env } = context;

  if (!env.PHOTO_BUCKET) {
    return jsonResponse({ error: "R2 binding PHOTO_BUCKET is not configured." }, 500);
  }

  const id = params.id;
  const photos = await loadPhotoList(env);
  const target = photos.find(item => item.id === id);

  if (!target) {
    return jsonResponse({ error: "Photo not found." }, 404);
  }

  await env.PHOTO_BUCKET.delete(target.key);
  const nextPhotos = photos.filter(item => item.id !== id);
  await savePhotoList(env, nextPhotos);

  return jsonResponse({ deleted: id, allPhotos: nextPhotos });
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

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
