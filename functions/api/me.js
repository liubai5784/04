import { corsHeaders, getUserByToken, jsonResponse, requireDb } from "./_loginCommon.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const missing = requireDb(env);
  if (missing) return missing;

  try {
    const token = request.headers.get("Authorization") || "";
    const user = await getUserByToken(env, token);

    if (!user) {
      return jsonResponse({ ok: false, msg: "登录失效" }, 401);
    }

    return jsonResponse({
      ok: true,
      user: user.username,
      avatar: user.avatar || "",
      bio: user.bio || "",
      msg: user.msg || ""
    });
  } catch (error) {
    return jsonResponse({ ok: false, msg: error.message || "读取用户失败" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
