// 繁體中文翻譯
window.i18n.loadLocale('zh-hk', {
  // 頁面標題
  'page.title': 'B站直播流提取器',

  // 頭部
  'header.title': 'B站直播流提取器',
  'header.subtitle': '從任意B站直播間提取可播放的流媒體地址。',

  // 第一部分：登入
  'login.title': '1. 登入（可選）',
  'login.hint': '登入後可解鎖更高畫質（原畫 / 4K / 杜比）。您的 Cookie 僅保存在本瀏覽器中，並僅轉發給嗶哩嗶哩。您可以將它們匯出為 JSON 檔案進行備份，或匯入已儲存的檔案以恢復工作階段而無需重新掃碼。',
  'login.btn.generate': '生成登入二維碼',
  'login.btn.regenerate': '重新生成二維碼',
  'login.btn.export': '匯出 Cookie',
  'login.btn.import': '匯入 Cookie',
  'login.btn.logout': '登出',
  'login.status.loggedIn': '已登入',
  'login.status.notLoggedIn': '未登入',
  'login.status.generating': '正在生成二維碼...',
  'login.status.scanQR': '請使用嗶哩嗶哩 APP 掃描二維碼',
  'login.status.scanned': '已掃描，等待確認...',
  'login.status.success': '登入成功！',
  'login.status.expired': '二維碼已過期，請重新生成',
  'login.status.timeout': '登入逾時，請重試',
  'login.status.noCookies': '沒有可匯出的 Cookie',
  'login.status.imported': 'Cookie 已匯入',
  'login.qr.hint': '使用嗶哩嗶哩 APP 掃描。',
  'login.qr.alt': '登入二維碼',
  'login.import.invalidJSON': '無效檔案：不是有效的 JSON',
  'login.import.invalidObject': '無效檔案：期望一個 JSON 物件',
  'login.import.noSESSDATA': '無效檔案：缺少 SESSDATA',
  'login.import.readError': '無法讀取檔案',
  'login.import.failed': '匯入失敗：{error}',

  // 第二部分：房間輸入
  'room.title': '2. 輸入直播間',
  'room.input.placeholder': 'live.bilibili.com/12345, b23.tv/XXXX, 或 12345',
  'room.btn.extract': '提取',
  'room.btn.extracting': '提取中...',
  'room.error.failed': '獲取直播間資訊失敗',
  'room.error.streamsFailed': '獲取流媒體失敗',

  // 第三部分：結果
  'results.best.title': '最佳畫質',
  'results.showAll': '顯示所有畫質',
  'results.room.liveNow': '直播中',
  'results.room.offline': '未開播',
  'results.room.meta': '房間 {roomId} · 主播：{anchor} · {status}',
  'results.copy': '複製',
  'results.copied': '已複製',
  'results.copyFailed': '失敗',

  // 頁尾
  'footer.disclaimer': '僅供個人使用。流媒體地址由嗶哩嗶哩簽發，具有時效性。',
  'footer.openSource': '開源於',
  'footer.github': 'GitHub',
  'footer.welcome': '。歡迎 Star 和提交 Issue。',

  // 語言選擇器
  'lang.selector': '語言',
  'lang.en': 'English',
  'lang.zh-cn': '简体中文',
  'lang.zh-hk': '繁體中文',
});
