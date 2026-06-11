export async function onRequestPost(context) {
  const { request, env } = context;
  const missing = checkBindings(env);
  if (missing) return missing;

  await ensureSchema(env);

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ ok: false, msg: "请求格式错误" }, 400);
  }

  const username = normalizeUsername(body.user);
  const password = String(body.pass || "");

  if (!username || !password) {
    return jsonResponse({ ok: false, msg: "用户名或密码不能为空" }, 400);
  }

  const user = await env.PHOTO_DB.prepare(
    `SELECT id, username, password_hash, salt FROM login_users WHERE username = ?`
  ).bind(username).first();

  if (!user) {
    return jsonResponse({ ok: false, msg: "用户不存在或密码错误" }, 401);
  }

  const passwordHash = await hashPassword(password, user.salt);
  if (passwordHash !== user.password_hash) {
    return jsonResponse({ ok: false, msg: "用户不存在或密码错误" }, 401);
  }

  await env.PHOTO_DB.prepare(
    `DELETE FROM login_sessions WHERE expires_at <= ?`
  ).bind(new Date().toISOString()).run();

  const token = `${crypto.randomUUID()}-${randomHex(16)}`;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await env.PHOTO_DB.prepare(
    `INSERT INTO login_sessions (token, user_id, created_at, expires_at)
     VALUES (?, ?, ?, ?)`
  ).bind(token, user.id, createdAt, expiresAt).run();

  return jsonResponse({ ok: true, token, user: user.username });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function checkBindings(env) {
  if (!env.PHOTO_DB) {
    return jsonResponse({ ok: false, msg: "D1 数据库 PHOTO_DB 尚未配置" }, 500);
  }
  return null;
}

async function ensureSchema(env) {
  await env.PHOTO_DB.prepare(
    `CREATE TABLE IF NOT EXISTS login_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      msg TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ).run();

  await env.PHOTO_DB.prepare(
    `CREATE TABLE IF NOT EXISTS login_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`
  ).run();
}

function normalizeUsername(value) {
  return String(value || "").trim();
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
