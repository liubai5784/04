import { corsHeaders, getUserByToken, jsonResponse, listUsers, requireDb } from "../_loginCommon.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const missing = requireDb(env);
  if (missing) return missing;

  try {
    const token = request.headers.get("Authorization") || "";
    const admin = await getUserByToken(env, token);

    if (!admin || admin.username !== "admin") {
      return jsonResponse({ ok: false, msg: "无权限" }, 403);
    }

    const users = await listUsers(env);
    return jsonResponse({ ok: true, users });
  } catch (error) {
    return jsonResponse({ ok: false, msg: error.message || "读取用户列表失败" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
