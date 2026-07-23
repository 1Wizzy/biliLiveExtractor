// Poll QR-code login status.
// On success, returns the login cookies captured from Bilibili's Set-Cookie
// so the browser can pass them back on later stream requests.
const { baseHeaders, sendJson } = require("../_lib/bili");

const POLL_URL =
  "https://passport.bilibili.com/x/passport-login/web/qrcode/poll";

// The cookies Bilibili uses to authenticate live-stream playback requests.
const WANTED_COOKIES = ["SESSDATA", "bili_jct", "DedeUserID", "DedeUserID__ckMd5"];

// Parse the `key=value` pair out of each Set-Cookie header entry.
function extractCookies(setCookie) {
  const cookies = {};
  if (!setCookie) return cookies;
  const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const entry of entries) {
    const pair = entry.split(";")[0];
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (WANTED_COOKIES.includes(name)) cookies[name] = value;
  }
  return cookies;
}

module.exports = async (req, res) => {
  const qrcodeKey = (req.query && req.query.qrcode_key) || "";
  if (!qrcodeKey) {
    return sendJson(res, 400, { error: "qrcode_key is required" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const url = `${POLL_URL}?qrcode_key=${encodeURIComponent(qrcodeKey)}`;
    const resp = await fetch(url, {
      headers: baseHeaders("https://www.bilibili.com/"),
      signal: controller.signal,
    });
    const data = await resp.json();
    const code = data && data.data ? data.data.code : -1;

    const body = { code };
    if (code === 0) {
      // getSetCookie() is available on modern runtimes; fall back to get().
      const raw =
        typeof resp.headers.getSetCookie === "function"
          ? resp.headers.getSetCookie()
          : resp.headers.get("set-cookie");
      body.cookies = extractCookies(raw);
    }
    return sendJson(res, 200, body);
  } catch (err) {
    return sendJson(res, 500, { error: String(err.message || err) });
  } finally {
    clearTimeout(timer);
  }
};
