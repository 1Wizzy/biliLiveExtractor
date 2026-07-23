// Frontend logic: QR login, room lookup, and stream rendering.
// Cookies captured after login are kept in localStorage and forwarded to the
// serverless API via the x-bili-cookies header.

const COOKIE_KEY = "bili_cookies";

const el = (id) => document.getElementById(id);
const loginBtn = el("loginBtn");
const logoutBtn = el("logoutBtn");
const loginStatus = el("loginStatus");
const qrBox = el("qrBox");
const qrImg = el("qrImg");
const roomForm = el("roomForm");
const roomInput = el("roomInput");
const roomError = el("roomError");
const results = el("results");
const roomMeta = el("roomMeta");
const bestBox = el("bestBox");
const bestUrl = el("bestUrl");
const showAll = el("showAll");
const allStreams = el("allStreams");

let pollTimer = null;

function getCookies() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_KEY) || "null");
  } catch {
    return null;
  }
}

function setCookies(cookies) {
  if (cookies && Object.keys(cookies).length) {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(cookies));
  }
  refreshLoginState();
}

function clearCookies() {
  localStorage.removeItem(COOKIE_KEY);
  refreshLoginState();
}

function refreshLoginState() {
  const cookies = getCookies();
  if (cookies && cookies.SESSDATA) {
    loginStatus.textContent = "Logged in";
    loginStatus.className = "status status-ok";
    logoutBtn.hidden = false;
    loginBtn.textContent = "Regenerate QR code";
  } else {
    loginStatus.textContent = "Not logged in";
    loginStatus.className = "status";
    logoutBtn.hidden = true;
    loginBtn.textContent = "Generate login QR code";
  }
}

// Render the QR code as an image via a public QR image service.
function renderQr(url) {
  const encoded = encodeURIComponent(url);
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
  qrBox.hidden = false;
}

async function startLogin() {
  stopPolling();
  loginBtn.disabled = true;
  loginStatus.textContent = "Generating QR code...";
  loginStatus.className = "status";
  try {
    const resp = await fetch("/api/qrcode/generate");
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Failed to generate QR code");
    renderQr(data.url);
    loginStatus.textContent = "Scan the QR code with the Bilibili app";
    pollLogin(data.qrcode_key);
  } catch (err) {
    loginStatus.textContent = err.message;
    loginStatus.className = "status status-err";
  } finally {
    loginBtn.disabled = false;
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function pollLogin(qrcodeKey) {
  const deadline = Date.now() + 180000; // 3 minutes
  pollTimer = setInterval(async () => {
    if (Date.now() > deadline) {
      stopPolling();
      loginStatus.textContent = "Login timed out, please try again";
      loginStatus.className = "status status-err";
      return;
    }
    try {
      const resp = await fetch(
        `/api/qrcode/poll?qrcode_key=${encodeURIComponent(qrcodeKey)}`
      );
      const data = await resp.json();
      if (data.code === 0) {
        stopPolling();
        qrBox.hidden = true;
        setCookies(data.cookies);
        loginStatus.textContent = "Login successful!";
        loginStatus.className = "status status-ok";
      } else if (data.code === 86038) {
        stopPolling();
        loginStatus.textContent = "QR code expired, please regenerate";
        loginStatus.className = "status status-err";
      } else if (data.code === 86090) {
        loginStatus.textContent = "Scanned, waiting for confirmation...";
      }
    } catch {
      // Transient error; keep polling until the deadline.
    }
  }, 3000);
}

function streamLabel(key) {
  return key
    .split("_")
    .map((p) => p.toUpperCase())
    .join(" - ");
}

function copyable(url) {
  const wrap = document.createElement("div");
  wrap.className = "stream-url";
  const code = document.createElement("code");
  code.textContent = url;
  const btn = document.createElement("button");
  btn.className = "btn btn-small";
  btn.textContent = "Copy";
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    } catch {
      btn.textContent = "Failed";
    }
  });
  wrap.append(code, btn);
  return wrap;
}

function renderAllStreams(all) {
  allStreams.innerHTML = "";
  const qns = Object.keys(all)
    .map(Number)
    .sort((a, b) => b - a);
  for (const qn of qns) {
    const info = all[qn];
    const group = document.createElement("div");
    group.className = "quality-group";
    const h = document.createElement("h4");
    h.textContent = `${info.quality_name} (${qn})`;
    group.appendChild(h);
    for (const [key, list] of Object.entries(info.streams)) {
      const sub = document.createElement("div");
      sub.className = "stream-sub";
      const label = document.createElement("div");
      label.className = "stream-key";
      label.textContent = streamLabel(key);
      sub.appendChild(label);
      list.forEach((s) => sub.appendChild(copyable(s.url)));
      group.appendChild(sub);
    }
    allStreams.appendChild(group);
  }
}

async function extractRoom(evt) {
  evt.preventDefault();
  roomError.hidden = true;
  results.hidden = true;
  const input = roomInput.value.trim();
  if (!input) return;

  const submitBtn = roomForm.querySelector("button");
  submitBtn.disabled = true;
  submitBtn.textContent = "Extracting...";

  const headers = {};
  const cookies = getCookies();
  if (cookies) headers["x-bili-cookies"] = JSON.stringify(cookies);

  try {
    const roomResp = await fetch(`/api/room?input=${encodeURIComponent(input)}`);
    const room = await roomResp.json();
    if (!roomResp.ok) throw new Error(room.error || "Failed to fetch room info");

    roomMeta.innerHTML = "";
    const title = document.createElement("div");
    title.className = "room-title";
    title.textContent = room.title;
    const meta = document.createElement("div");
    meta.className = "room-sub";
    meta.textContent = `Room ${room.room_id} · Anchor: ${room.anchor} · ${
      room.is_live ? "Live now" : "Offline"
    }`;
    roomMeta.append(title, meta);
    results.hidden = false;

    if (!room.is_live) {
      bestBox.hidden = true;
      allStreams.hidden = true;
      showAll.checked = false;
      allStreams.innerHTML = "";
      return;
    }

    const streamResp = await fetch(
      `/api/streams?input=${encodeURIComponent(input)}`,
      { headers }
    );
    const streams = await streamResp.json();
    if (!streamResp.ok) throw new Error(streams.error || "Failed to fetch streams");

    if (streams.best) {
      bestUrl.innerHTML = "";
      const label = document.createElement("div");
      label.className = "best-label";
      label.textContent = streams.best.quality_name;
      bestUrl.appendChild(label);
      bestUrl.appendChild(copyable(streams.best.url));
      bestBox.hidden = false;
    } else {
      bestBox.hidden = true;
    }

    renderAllStreams(streams.all_streams || {});
    allStreams.hidden = !showAll.checked;
  } catch (err) {
    roomError.textContent = err.message;
    roomError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Extract";
  }
}

loginBtn.addEventListener("click", startLogin);
logoutBtn.addEventListener("click", clearCookies);
roomForm.addEventListener("submit", extractRoom);
showAll.addEventListener("change", () => {
  allStreams.hidden = !showAll.checked;
});

refreshLoginState();
