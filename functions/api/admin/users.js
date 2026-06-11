export async function onRequestGet(context) {
  const { request, env } = context;
  const missing = checkBindings(env);
  if (missing) return missing;

  await ensureSchema(env);

  const token = request.headers.get("Authorization") || "";
  const admin = await getUserByToken(env, token);

  if (!admin || admin.username !== "admin") {
    return jsonResponse({ ok: false, msg: "无权限" }, 403);
  }

  const { results } = await env.PHOTO_DB.prepare(
    `SELECT username, avatar, bio, msg, created_at AS createdAt
     FROM login_users
     ORDER BY created_at DESC`
  ).all();

  return jsonResponse({ ok: true, users: results || [] });
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

async function getUserByToken(env, token) {
  if (!token) return null;

  await env.PHOTO_DB.prepare(
    `DELETE FROM login_sessions WHERE expires_at <= ?`
  ).bind(new Date().toISOString()).run();

  return await env.PHOTO_DB.prepare(
    `SELECT u.id, u.username
     FROM login_sessions s
     JOIN login_users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`
  ).bind(token, new Date().toISOString()).first();
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
