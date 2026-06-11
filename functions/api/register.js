import { corsHeaders, jsonResponse, normalizeUsername, registerUser, requireDb } from "./_loginCommon.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const missing = requireDb(env);
  if (missing) return missing;

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

  try {
    const result = await registerUser(env, username, password);
    if (!result.ok) {
      return jsonResponse({ ok: false, msg: result.msg }, result.status || 400);
    }
    return jsonResponse({ ok: true, msg: "注册成功" });
  } catch (error) {
    return jsonResponse({ ok: false, msg: error.message || "注册失败" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
