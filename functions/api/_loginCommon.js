const USER_TABLE = "users";
const SESSION_TABLE = "login_sessions";

export function requireDb(env) {
  if (!env.PHOTO_DB) {
    return jsonResponse({ ok: false, msg: "D1 数据库 PHOTO_DB 尚未配置" }, 500);
  }
  return null;
}

export async function ensureAuthSchema(env) {
  await env.PHOTO_DB.prepare(
    `CREATE TABLE IF NOT EXISTS ${USER_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      msg TEXT,
      created_at TEXT,
      updated_at TEXT
    )`
  ).run();

  let schema = await getUserSchema(env);

  if (!schema.passwordCol && !(schema.passwordHashCol && schema.saltCol)) {
    await addTextColumnIfMissing(env, schema, "password");
    schema = await getUserSchema(env);
  }

  for (const column of ["avatar", "bio", "msg", "created_at", "updated_at"]) {
    if (!schema.columns.has(column)) {
      await addTextColumnIfMissing(env, schema, column);
      schema.columns.add(column);
    }
  }

  await env.PHOTO_DB.prepare(
    `CREATE TABLE IF NOT EXISTS ${SESSION_TABLE} (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`
  ).run();

  await env.PHOTO_DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON ${SESSION_TABLE}(token)`
  ).run();

  return await getUserSchema(env);
}

export async function registerUser(env, username, password) {
  const schema = await ensureAuthSchema(env);
  assertUserSchema(schema);

  const existed = await findUserByUsername(env, username, schema);
  if (existed) {
    return { ok: false, status: 409, msg: "用户名已存在" };
  }

  const now = new Date().toISOString();
  const columns = [schema.usernameCol];
  const values = [username];

  if (schema.passwordHashCol && schema.saltCol) {
    const salt = randomHex(16);
    columns.push(schema.passwordHashCol, schema.saltCol);
    values.push(await hashPassword(password, salt), salt);
  } else if (schema.passwordCol) {
    columns.push(schema.passwordCol);
    values.push(password);
  }

  for (const [key, value] of [
    [schema.avatarCol, ""],
    [schema.bioCol, ""],
    [schema.msgCol, ""],
    [schema.createdCol, now],
    [schema.updatedCol, now]
  ]) {
    if (key && !columns.includes(key)) {
      columns.push(key);
      values.push(value);
    }
  }

  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${USER_TABLE} (${columns.map(q).join(", ")}) VALUES (${placeholders})`;
  await env.PHOTO_DB.prepare(sql).bind(...values).run();

  return { ok: true };
}

export async function loginUser(env, username, password) {
  const schema = await ensureAuthSchema(env);
  assertUserSchema(schema);

  const row = await findUserByUsername(env, username, schema);
  if (!row) return null;

  const passOk = await verifyPassword(row, password, schema);
  if (!passOk) return null;

  const token = `${crypto.randomUUID()}-${randomHex(16)}`;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await env.PHOTO_DB.prepare(
    `DELETE FROM ${SESSION_TABLE} WHERE expires_at <= ?`
  ).bind(createdAt).run();

  await env.PHOTO_DB.prepare(
    `INSERT INTO ${SESSION_TABLE} (token, user_id, created_at, expires_at)
     VALUES (?, ?, ?, ?)`
  ).bind(token, getUsername(row, schema), createdAt, expiresAt).run();

  return { token, username: getUsername(row, schema) };
}

export async function getUserByToken(env, token) {
  if (!token) return null;

  const schema = await ensureAuthSchema(env);
  const now = new Date().toISOString();

  await env.PHOTO_DB.prepare(
    `DELETE FROM ${SESSION_TABLE} WHERE expires_at <= ?`
  ).bind(now).run();

  const session = await env.PHOTO_DB.prepare(
    `SELECT user_id FROM ${SESSION_TABLE} WHERE token = ? AND expires_at > ?`
  ).bind(token, now).first();

  if (!session) return null;
  const row = await findUserByUsername(env, session.user_id, schema);
  if (!row) return null;

  return normalizeUser(row, schema);
}

export async function updateCurrentUserField(env, token, field, value) {
  const user = await getUserByToken(env, token);
  if (!user) return null;

  const schema = await ensureAuthSchema(env);
  const fieldMap = {
    avatar: schema.avatarCol,
    bio: schema.bioCol,
    msg: schema.msgCol
  };

  const targetCol = fieldMap[field];
  if (!targetCol) {
    throw new Error(`users 表中找不到 ${field} 字段`);
  }

  const updates = [`${q(targetCol)} = ?`];
  const values = [value];

  if (schema.updatedCol) {
    updates.push(`${q(schema.updatedCol)} = ?`);
    values.push(new Date().toISOString());
  }

  values.push(user.username);

  await env.PHOTO_DB.prepare(
    `UPDATE ${USER_TABLE} SET ${updates.join(", ")} WHERE ${q(schema.usernameCol)} = ?`
  ).bind(...values).run();

  return user;
}

export async function listUsers(env) {
  const schema = await ensureAuthSchema(env);
  assertUserSchema(schema);

  const orderSql = schema.createdCol ? `${q(schema.createdCol)} DESC` : `rowid DESC`;
  const { results } = await env.PHOTO_DB.prepare(
    `SELECT rowid AS __rowid, * FROM ${USER_TABLE} ORDER BY ${orderSql}`
  ).all();

  return (results || []).map(row => normalizeUser(row, schema));
}

export function normalizeUsername(value) {
  return String(value || "").trim();
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
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
  const { results } = await env.PHOTO_DB.prepare(`PRAGMA table_info(${USER_TABLE})`).all();
  const columns = new Set((results || []).map(col => col.name));

  return {
    columns,
    usernameCol: pick(columns, ["username", "user", "name"]),
    passwordCol: pick(columns, ["password", "pass", "pwd"]),
    passwordHashCol: pick(columns, ["password_hash", "passwordHash", "pass_hash"]),
    saltCol: pick(columns, ["salt", "password_salt"]),
    avatarCol: pick(columns, ["avatar", "avatar_url", "photo"]),
    bioCol: pick(columns, ["bio", "intro", "profile"]),
    msgCol: pick(columns, ["msg", "message", "comment"]),
    createdCol: pick(columns, ["created_at", "createdAt", "created", "time"]),
    updatedCol: pick(columns, ["updated_at", "updatedAt", "updated"])
  };
}

async function addTextColumnIfMissing(env, schema, column) {
  if (schema.columns.has(column)) return;
  await env.PHOTO_DB.prepare(
    `ALTER TABLE ${USER_TABLE} ADD COLUMN ${q(column)} TEXT DEFAULT ''`
  ).run();
}

function assertUserSchema(schema) {
  if (!schema.usernameCol) {
    throw new Error("users 表中找不到用户名字段，请确认是否有 username / user / name 字段");
  }
  if (!schema.passwordCol && !(schema.passwordHashCol && schema.saltCol)) {
    throw new Error("users 表中找不到密码字段，请确认是否有 password / pass / pwd 字段");
  }
}

async function findUserByUsername(env, username, schema) {
  return await env.PHOTO_DB.prepare(
    `SELECT rowid AS __rowid, * FROM ${USER_TABLE} WHERE ${q(schema.usernameCol)} = ?`
  ).bind(username).first();
}

async function verifyPassword(row, password, schema) {
  if (schema.passwordHashCol && schema.saltCol && row[schema.passwordHashCol]) {
    const passwordHash = await hashPassword(password, row[schema.saltCol] || "");
    if (passwordHash === row[schema.passwordHashCol]) return true;
  }

  if (schema.passwordCol) {
    return String(row[schema.passwordCol] ?? "") === password;
  }

  return false;
}

function normalizeUser(row, schema) {
  return {
    id: row.__rowid,
    username: getUsername(row, schema),
    avatar: schema.avatarCol ? row[schema.avatarCol] || "" : "",
    bio: schema.bioCol ? row[schema.bioCol] || "" : "",
    msg: schema.msgCol ? row[schema.msgCol] || "" : "",
    createdAt: schema.createdCol ? row[schema.createdCol] || "" : ""
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
