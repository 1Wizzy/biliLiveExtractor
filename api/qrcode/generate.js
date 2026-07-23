// Generate a login QR code. Returns { qrcode_key, url }.
const { baseHeaders, fetchJson, sendJson } = require("../_lib/bili");

const GEN_URL =
  "https://passport.bilibili.com/x/passport-login/web/qrcode/generate";

module.exports = async (req, res) => {
  try {
    const { data } = await fetchJson(GEN_URL, {
      headers: baseHeaders("https://www.bilibili.com/"),
    });
    if (data.code !== 0) {
      return sendJson(res, 502, { error: data.message || "generate failed" });
    }
    return sendJson(res, 200, {
      qrcode_key: data.data.qrcode_key,
      url: data.data.url,
    });
  } catch (err) {
    return sendJson(res, 500, { error: String(err.message || err) });
  }
};
