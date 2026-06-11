const SOURCE_BASE = "https://raw.githubusercontent.com/liubai5784/qingtankuaipao/main/public";

const CONTENT_TYPES = {
  html: "text/html; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml; charset=utf-8"
};

function normalizePath(pathParam) {
  const rawPath = Array.isArray(pathParam) ? pathParam.join("/") : pathParam;
  const cleanPath = String(rawPath || "index.html")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "");

  return cleanPath || "index.html";
}

function getContentType(pathname, fallback) {
  const extension = pathname.split(".").pop()?.toLowerCase();
  return CONTENT_TYPES[extension] || fallback || "application/octet-stream";
}

export async function onRequest(context) {
  const filePath = normalizePath(context.params.path);
  const sourceUrl = `${SOURCE_BASE}/${filePath}`;

  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "liubai-gallery-site" }
  });

  if (!response.ok) {
    return new Response("轻坦快跑资源暂时加载失败。", {
      status: response.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", getContentType(filePath, response.headers.get("Content-Type")));
  headers.set("Cache-Control", filePath === "index.html" ? "no-cache" : "public, max-age=86400");

  return new Response(response.body, {
    status: 200,
    headers
  });
}
