// Frontend logic: QR login, room lookup, and stream rendering.
// Cookies captured after login are kept in localStorage and forwarded to the
// serverless API via the x-bili-cookies header.

const COOKIE_KEY = "bili_cookies";

const el = (id) => document.getElementById(id);
const loginBtn = el("loginBtn");
const logoutBtn = el("logoutBtn");
const exportBtn = el("exportBtn");
const importBtn = el("importBtn");
const importFile = el("importFile");
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
const langSelect = el("langSelect");

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
    loginStatus.textContent = i18n.t('login.status.loggedIn');
    loginStatus.className = "status status-ok";
    logoutBtn.hidden = false;
    exportBtn.hidden = false;
    loginBtn.textContent = i18n.t('login.btn.regenerate');
  } else {
    loginStatus.textContent = i18n.t('login.status.notLoggedIn');
    loginStatus.className = "status";
    logoutBtn.hidden = true;
    exportBtn.hidden = true;
    loginBtn.textContent = i18n.t('login.btn.generate');
  }
}

// Export the stored cookies as a downloadable JSON file.
function exportCookies() {
  const cookies = getCookies();
  if (!cookies || !Object.keys(cookies).length) {
    loginStatus.textContent = i18n.t('login.status.noCookies');
    loginStatus.className = "status status-err";
    return;
  }
  const blob = new Blob([JSON.stringify(cookies, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bili-cookies.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Import cookies from a user-selected JSON file.
async function importCookies(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(i18n.t('login.import.invalidObject'));
    }
    if (!parsed.SESSDATA) {
      throw new Error(i18n.t('login.import.noSESSDATA'));
    }
    // Keep only string values; ignore anything unexpected.
    const cookies = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") cookies[k] = v;
    }
    localStorage.setItem(COOKIE_KEY, JSON.stringify(cookies));
    refreshLoginState();
    loginStatus.textContent = i18n.t('login.status.imported');
    loginStatus.className = "status status-ok";
  } catch (err) {
    loginStatus.textContent = i18n.t('login.import.failed', { error: err.message });
    loginStatus.className = "status status-err";
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
  loginStatus.textContent = i18n.t('login.status.generating');
  loginStatus.className = "status";
  try {
    const resp = await fetch("/api/qrcode/generate");
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Failed to generate QR code");
    renderQr(data.url);
    loginStatus.textContent = i18n.t('login.status.scanQR');
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
      loginStatus.textContent = i18n.t('login.status.timeout');
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
        loginStatus.textContent = i18n.t('login.status.success');
        loginStatus.className = "status status-ok";
      } else if (data.code === 86038) {
        stopPolling();
        loginStatus.textContent = i18n.t('login.status.expired');
        loginStatus.className = "status status-err";
      } else if (data.code === 86090) {
        loginStatus.textContent = i18n.t('login.status.scanned');
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
  btn.textContent = i18n.t('results.copy');
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = i18n.t('results.copied');
      setTimeout(() => (btn.textContent = i18n.t('results.copy')), 1500);
    } catch {
      btn.textContent = i18n.t('results.copyFailed');
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
  submitBtn.textContent = i18n.t('room.btn.extracting');

  const headers = {};
  const cookies = getCookies();
  if (cookies) headers["x-bili-cookies"] = JSON.stringify(cookies);

  try {
    const roomResp = await fetch(`/api/room?input=${encodeURIComponent(input)}`);
    const room = await roomResp.json();
    if (!roomResp.ok) throw new Error(room.error || i18n.t('room.error.failed'));

    roomMeta.innerHTML = "";
    const title = document.createElement("div");
    title.className = "room-title";
    title.textContent = room.title;
    const meta = document.createElement("div");
    meta.className = "room-sub";
    const status = room.is_live ? i18n.t('results.room.liveNow') : i18n.t('results.room.offline');
    meta.textContent = i18n.t('results.room.meta', {
      roomId: room.room_id,
      anchor: room.anchor,
      status: status
    });
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
    if (!streamResp.ok) throw new Error(streams.error || i18n.t('room.error.streamsFailed'));

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
    submitBtn.textContent = i18n.t('room.btn.extract');
  }
}

loginBtn.addEventListener("click", startLogin);
logoutBtn.addEventListener("click", clearCookies);
exportBtn.addEventListener("click", exportCookies);
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  importCookies(importFile.files[0]);
  importFile.value = ""; // allow re-importing the same file
});
roomForm.addEventListener("submit", extractRoom);
showAll.addEventListener("change", () => {
  allStreams.hidden = !showAll.checked;
});

// Language selector
langSelect.value = i18n.getLocale();
langSelect.addEventListener("change", () => {
  i18n.setLocale(langSelect.value);
  refreshLoginState();
});

// Initialize i18n and update page
i18n.updatePage();
refreshLoginState();
