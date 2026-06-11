import { corsHeaders, jsonResponse, requireDb, updateCurrentUserField } from "./_loginCommon.js";

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

  const msg = String(body.msg || "").slice(0, 500);

  try {
    const user = await updateCurrentUserField(env, String(body.token || ""), "msg", msg);
    if (!user) {
      return jsonResponse({ ok: false, msg: "登录失效" }, 401);
    }
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, msg: error.message || "留言保存失败" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
