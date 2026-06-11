const USER_TABLE = "users";

function getDb(env) {
  return env.PHOTO_DB || env.DB || env.CESHI03 || env.ceshi03 || null;
}

export function requireDb(env) {
  if (!getDb(env)) return jsonResponse({ ok: false, msg: "D1 数据库尚未配置，请绑定为 PHOTO_DB 或 DB" }, 500);
  return null;
}

export async function ensureAuthSchema(env) {
  const db = getDb(env);
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS ${USER_TABLE} (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, token TEXT, avatar TEXT, bio TEXT, msg TEXT)`
  ).run();

  const schema = await getUserSchema(env);
  for (const column of ["username", "password", "token", "avatar", "bio", "msg"]) {
    if (!schema.columns.has(column)) {
      await db.prepare(`ALTER TABLE ${USER_TABLE} ADD COLUMN ${q(column)} TEXT DEFAULT ''`).run();
      schema.columns.add(column);
    }
  }

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_username ON ${USER_TABLE}(username)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_token ON ${USER_TABLE}(token)`).run();
  return await getUserSchema(env);
}

export async function registerUser(env, username, pass) {
  const db = getDb(env);
  const schema = await ensureAuthSchema(env);
  assertUserSchema(schema);

  const existed = await findUserByUsername(env, username, schema);
  if (existed) return { ok: false, status: 409, msg: "用户名已存在" };

  await db.prepare(
    `INSERT INTO ${USER_TABLE} (${q(schema.usernameCol)}, ${q(schema.passwordCol)}, ${q(schema.tokenCol)}, ${q(schema.avatarCol)}, ${q(schema.bioCol)}, ${q(schema.msgCol)}) VALUES (?, ?, '', '', '', '')`
  ).bind(username, pass).run();

  return { ok: true };
}

export async function loginUser(env, username, pass) {
  const db = getDb(env);
  const schema = await ensureAuthSchema(env);
  assertUserSchema(schema);

  const row = await findUserByUsername(env, username, schema);
  if (!row) return null;
  if (String(row[schema.passwordCol] ?? "") !== pass) return null;

  const token = `${crypto.randomUUID()}-${randomHex(16)}`;
  await db.prepare(
    `UPDATE ${USER_TABLE} SET ${q(schema.tokenCol)} = ? WHERE ${q(schema.usernameCol)} = ?`
  ).bind(token, username).run();

  return { token, username: getUsername(row, schema) };
}

export async function getUserByToken(env, token) {
  const safeToken = String(token || "").trim();
  if (!safeToken) return null;

  const db = getDb(env);
  const schema = await ensureAuthSchema(env);
  assertUserSchema(schema);
  const row = await db.prepare(
    `SELECT * FROM ${USER_TABLE} WHERE ${q(schema.tokenCol)} = ? LIMIT 1`
  ).bind(safeToken).first();

  return row ? normalizeUser(row, schema) : null;
}

export async function updateCurrentUserField(env, token, field, value) {
  const db = getDb(env);
  const user = await getUserByToken(env, token);
  if (!user) return null;

  const schema = await ensureAuthSchema(env);
  const fieldMap = { avatar: schema.avatarCol, bio: schema.bioCol, msg: schema.msgCol };
  const targetCol = fieldMap[field];
  if (!targetCol) throw new Error(`users 表中找不到 ${field} 字段`);

  await db.prepare(
    `UPDATE ${USER_TABLE} SET ${q(targetCol)} = ? WHERE ${q(schema.usernameCol)} = ?`
  ).bind(String(value || ""), user.username).run();

  return await getUserByToken(env, token);
}

export async function listUsers(env) {
  const db = getDb(env);
  const schema = await ensureAuthSchema(env);
  assertUserSchema(schema);
  const orderCol = schema.idCol || schema.usernameCol;
  const { results } = await db.prepare(`SELECT * FROM ${USER_TABLE} ORDER BY ${q(orderCol)} DESC`).all();
  return (results || []).map(row => normalizeUser(row, schema));
}

export function normalizeUsername(value) {
  return String(value || "").trim();
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() }
  });
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

async function getUserSchema(env) {
  const db = getDb(env);
  const { results } = await db.prepare(`PRAGMA table_info(${USER_TABLE})`).all();
  const columns = new Set((results || []).map(col => col.name));
  return {
    columns,
    idCol: pick(columns, ["id"]),
    usernameCol: pick(columns, ["username", "user", "name"]),
    passwordCol: pick(columns, ["password", "pass", "pwd"]),
    tokenCol: pick(columns, ["token"]),
    avatarCol: pick(columns, ["avatar", "avatar_url", "photo"]),
    bioCol: pick(columns, ["bio", "intro", "profile"]),
    msgCol: pick(columns, ["msg", "message", "comment"])
  };
}

function assertUserSchema(schema) {
  if (!schema.usernameCol) throw new Error("users 表中找不到 username 字段");
  if (!schema.passwordCol) throw new Error("users 表中找不到 password 字段");
  if (!schema.tokenCol) throw new Error("users 表中找不到 token 字段");
  if (!schema.avatarCol || !schema.bioCol || !schema.msgCol) throw new Error("users 表中找不到 avatar / bio / msg 字段");
}

async function findUserByUsername(env, username, schema) {
  const db = getDb(env);
  return await db.prepare(
    `SELECT * FROM ${USER_TABLE} WHERE ${q(schema.usernameCol)} = ? LIMIT 1`
  ).bind(username).first();
}

function normalizeUser(row, schema) {
  return {
    id: schema.idCol ? row[schema.idCol] : "",
    username: getUsername(row, schema),
    avatar: row[schema.avatarCol] || "",
    bio: row[schema.bioCol] || "",
    msg: row[schema.msgCol] || ""
  };
}

function getUsername(row, schema) {
  return String(row[schema.usernameCol] || "");
}

function pick(columns, candidates) {
  return candidates.find(name => columns.has(name)) || null;
}

function q(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function randomHex(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
