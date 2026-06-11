import { corsHeaders, jsonResponse, loginUser, normalizeUsername, requireDb } from "./_loginCommon.js";

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

  try {
    const result = await loginUser(env, username, password);
    if (!result) {
      return jsonResponse({ ok: false, msg: "用户不存在或密码错误" }, 401);
    }

    return jsonResponse({ ok: true, token: result.token, user: result.username });
  } catch (error) {
    return jsonResponse({ ok: false, msg: error.message || "登录失败" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
