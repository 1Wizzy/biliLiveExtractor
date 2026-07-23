// Fetch basic room info for a live room.
// Query: ?input=<room url or id>
const { baseHeaders, fetchJson, resolveRoomId, sendJson } = require("./_lib/bili");

const ROOM_INFO_URL = "https://api.live.bilibili.com/room/v1/Room/get_info";

// Safely pull the anchor name out of the nested pendant structure.
function getAnchorName(roomInfo) {
  const pendants = (roomInfo && roomInfo.new_pendants) || {};
  const badge = pendants.badge || {};
  return badge.desc || "Unknown";
}

module.exports = async (req, res) => {
  const input = (req.query && req.query.input) || "";
  const roomId = await resolveRoomId(input);
  if (!roomId) {
    return sendJson(res, 400, { error: "Could not extract room id" });
  }

  try {
    const { data } = await fetchJson(
      `${ROOM_INFO_URL}?room_id=${encodeURIComponent(roomId)}`,
      { headers: baseHeaders("https://live.bilibili.com/") }
    );
    if (data.code !== 0) {
      return sendJson(res, 502, { error: data.message || "room info failed" });
    }
    const info = data.data;
    return sendJson(res, 200, {
      room_id: roomId,
      title: info.title || "Unknown",
      anchor: getAnchorName(info),
      live_status: info.live_status,
      is_live: info.live_status === 1,
    });
  } catch (err) {
    return sendJson(res, 500, { error: String(err.message || err) });
  }
};
