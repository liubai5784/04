export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.PHOTO_BUCKET) {
    return new Response("R2 binding PHOTO_BUCKET is not configured.", { status: 500 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key || !key.startsWith("photos/")) {
    return new Response("Invalid photo key.", { status: 400 });
  }

  const object = await env.PHOTO_BUCKET.get(key);
  if (!object) {
    return new Response("Photo not found.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);

  return new Response(object.body, { headers });
}
