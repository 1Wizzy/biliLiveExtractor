// Fetch stream URLs for every quality of a live room.
// Query: ?input=<room url or id>
// Optional header: x-bili-cookies = JSON string of { SESSDATA, ... }
const {
  QUALITY_MAP,
  QUALITY_PRIORITY,
  baseHeaders,
  fetchJson,
  resolveRoomId,
  parseStreams,
  getBestStream,
  sendJson,
} = require("./_lib/bili");

const PLAY_INFO_URL =
  "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo";

// Build a Cookie header from the JSON blob the client forwards.
function cookieHeader(req) {
  const raw = req.headers["x-bili-cookies"];
  if (!raw) return "";
  try {
    const obj = JSON.parse(raw);
    return Object.entries(obj)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  } catch {
    return "";
  }
}

async function getPlayUrl(roomId, qn, headers) {
  const params = new URLSearchParams({
    room_id: roomId,
    no_playurl: "0",
    mask: "0",
    qn: String(qn),
    platform: "web",
    protocol: "0,1",
    format: "0,1,2",
    codec: "0,1,2",
  });
  const { data } = await fetchJson(`${PLAY_INFO_URL}?${params}`, { headers });
  if (data.code === 0 && data.data && data.data.playurl_info) {
    const playurl = data.data.playurl_info.playurl;
    if (playurl) return parseStreams(playurl);
  }
  return null;
}

module.exports = async (req, res) => {
  const input = (req.query && req.query.input) || "";
  const roomId = await resolveRoomId(input);
  if (!roomId) {
    return sendJson(res, 400, { error: "Could not extract room id" });
  }

  const headers = baseHeaders("https://live.bilibili.com/");
  const cookie = cookieHeader(req);
  if (cookie) headers.Cookie = cookie;

  try {
    // Fetch all qualities concurrently.
    const results = await Promise.allSettled(
      QUALITY_PRIORITY.map((qn) => getPlayUrl(roomId, qn, headers))
    );

    const allStreams = {};
    results.forEach((result, i) => {
      const qn = QUALITY_PRIORITY[i];
      if (result.status === "fulfilled" && result.value) {
        if (Object.keys(result.value).length) {
          allStreams[qn] = {
            quality_name: QUALITY_MAP[qn],
            streams: result.value,
          };
        }
      }
    });

    if (!Object.keys(allStreams).length) {
      return sendJson(res, 200, { room_id: roomId, all_streams: {}, best: null });
    }

    return sendJson(res, 200, {
      room_id: roomId,
      all_streams: allStreams,
      best: getBestStream(allStreams),
    });
  } catch (err) {
    return sendJson(res, 500, { error: String(err.message || err) });
  }
};
