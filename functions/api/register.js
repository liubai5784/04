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

  if (username.length > 32) {
    return jsonResponse({ ok: false, msg: "用户名太长" }, 400);
  }

  if (password.length < 3) {
    return jsonResponse({ ok: false, msg: "密码至少 3 位" }, 400);
  }

  if (password.length > 128) {
    return jsonResponse({ ok: false, msg: "密码太长" }, 400);
  }

  const existed = await env.PHOTO_DB.prepare(
    `SELECT id FROM login_users WHERE username = ?`
  ).bind(username).first();

  if (existed) {
    return jsonResponse({ ok: false, msg: "用户名已存在" }, 409);
  }

  const id = crypto.randomUUID();
  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  await env.PHOTO_DB.prepare(
    `INSERT INTO login_users (id, username, password_hash, salt, avatar, bio, msg, created_at, updated_at)
     VALUES (?, ?, ?, ?, '', '', '', ?, ?)`
  ).bind(id, username, passwordHash, salt, now, now).run();

  return jsonResponse({ ok: true, msg: "注册成功" });
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

  await env.PHOTO_DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_login_users_username ON login_users(username)`
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
