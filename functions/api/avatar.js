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

  const avatar = String(body.avatar || "");
  if (!avatar.startsWith("data:image/")) {
    return jsonResponse({ ok: false, msg: "头像格式错误" }, 400);
  }

  if (avatar.length > 900 * 1024) {
    return jsonResponse({ ok: false, msg: "头像太大，请先压缩图片" }, 413);
  }

  try {
    const user = await updateCurrentUserField(env, String(body.token || ""), "avatar", avatar);
    if (!user) {
      return jsonResponse({ ok: false, msg: "登录失效" }, 401);
    }
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, msg: error.message || "头像更新失败" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
