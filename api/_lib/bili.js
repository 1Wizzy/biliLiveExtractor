// Shared helpers for talking to Bilibili's web APIs from Vercel functions.

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Safari/537.36";

// Quality code (qn) -> human readable name.
const QUALITY_MAP = {
  30000: "Dolby",
  20000: "4K",
  10000: "Original",
  400: "Blu-ray",
  250: "Super HD",
  150: "HD",
  80: "Smooth",
};

// Quality priority from highest to lowest.
const QUALITY_PRIORITY = [30000, 20000, 10000, 400, 250, 150, 80];

function baseHeaders(referer) {
  return {
    "User-Agent": DEFAULT_UA,
    Referer: referer || "https://www.bilibili.com/",
    Origin: "https://www.bilibili.com",
  };
}

// Fetch JSON with a timeout, throwing on non-2xx or invalid JSON.
async function fetchJson(url, { headers, timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { headers, signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    return { data: await resp.json(), headers: resp.headers };
  } finally {
    clearTimeout(timer);
  }
}

// Return a CDN-independent identity for a stream URL. The same logical stream
// is served from many CDN hosts with different query signatures; the path's
// final segment (e.g. live_50329118_9516950_2500.flv) is stable, so it is used
// to de-duplicate streams returned across multiple qn requests.
function streamIdentity(url) {
  if (!url) return url;
  const path = String(url).split("?", 1)[0];
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

// Extract a room id from a live room URL or a bare number.
function extractRoomId(input) {
  if (!input) return null;
  const value = String(input).trim();
  if (/^\d+$/.test(value)) return value;
  const match = value.match(/live\.bilibili\.com\/(?:\w+\/)?(\d+)/);
  return match ? match[1] : null;
}

// b23.tv short links redirect to the real room URL. Follow the redirect and
// return the final URL, or the original input if it isn't a short link.
async function resolveShortUrl(input, { timeout = 10000 } = {}) {
  const value = String(input || "").trim();
  if (!/(?:^|\/\/)(?:www\.)?b23\.tv\//.test(value)) return value;
  const url = /^https?:\/\//.test(value) ? value : `https://${value}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    // fetch follows redirects by default; resp.url is the final location.
    const resp = await fetch(url, {
      method: "GET",
      headers: baseHeaders("https://www.bilibili.com/"),
      signal: controller.signal,
    });
    return resp.url || value;
  } catch {
    return value;
  } finally {
    clearTimeout(timer);
  }
}

// Resolve any supported input (room id, live URL, or b23.tv short link)
// to a room id, following short-link redirects when needed.
async function resolveRoomId(input) {
  const direct = extractRoomId(input);
  if (direct) return direct;
  const resolved = await resolveShortUrl(input);
  return extractRoomId(resolved);
}

// Flatten Bilibili's nested playurl structure into keyed stream lists.
function parseStreams(playInfo) {
  const streams = {};
  const streamList = (playInfo && playInfo.stream) || [];
  for (const stream of streamList) {
    const protocolName = stream.protocol_name || "unknown";
    for (const formatInfo of stream.format || []) {
      const formatName = formatInfo.format_name || "unknown";
      for (const codec of formatInfo.codec || []) {
        const codecName = codec.codec_name || "unknown";
        const currentQn = codec.current_qn || 0;
        const baseUrl = codec.base_url || "";
        const streamKey = `${protocolName}_${formatName}_${codecName}`;
        for (const urlInfo of codec.url_info || []) {
          const fullUrl =
            (urlInfo.host || "") + baseUrl + (urlInfo.extra || "");
          if (!streams[streamKey]) streams[streamKey] = [];
          streams[streamKey].push({
            url: fullUrl,
            protocol: protocolName,
            format: formatName,
            codec: codecName,
            current_qn: currentQn,
            quality_name: QUALITY_MAP[currentQn] || `Unknown(${currentQn})`,
          });
        }
      }
    }
  }
  return streams;
}

// Return the single highest-quality stream by priority.
function getBestStream(allStreams) {
  const preferredKeys = [
    "http_stream_flv_avc",
    "http_stream_flv_hevc",
    "http_hls_ts_avc",
    "http_hls_ts_hevc",
  ];
  for (const qn of QUALITY_PRIORITY) {
    const info = allStreams[qn];
    if (!info || !info.streams) continue;
    for (const key of preferredKeys) {
      if (info.streams[key] && info.streams[key].length) {
        return { quality_name: info.quality_name, url: info.streams[key][0].url };
      }
    }
  }
  return null;
}

// Small CORS/JSON helpers so every handler behaves consistently.
function sendJson(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).send(JSON.stringify(body));
}

module.exports = {
  DEFAULT_UA,
  QUALITY_MAP,
  QUALITY_PRIORITY,
  baseHeaders,
  fetchJson,
  streamIdentity,
  extractRoomId,
  resolveShortUrl,
  resolveRoomId,
  parseStreams,
  getBestStream,
  sendJson,
};
