// 简体中文翻译
window.i18n.loadLocale('zh-cn', {
  // 页面标题
  'page.title': 'B站直播流提取器',

  // 头部
  'header.title': 'B站直播流提取器',
  'header.subtitle': '从任意B站直播间提取可播放的流媒体地址。',

  // 第一部分：登录
  'login.title': '1. 登录（可选）',
  'login.hint': '登录后可解锁更高画质（原画 / 4K / 杜比）。您的 Cookie 仅保存在本浏览器中，并仅转发给哔哩哔哩。您可以将它们导出为 JSON 文件进行备份，或导入已保存的文件以恢复会话而无需重新扫码。',
  'login.btn.generate': '生成登录二维码',
  'login.btn.regenerate': '重新生成二维码',
  'login.btn.export': '导出 Cookie',
  'login.btn.import': '导入 Cookie',
  'login.btn.logout': '退出登录',
  'login.status.loggedIn': '已登录',
  'login.status.notLoggedIn': '未登录',
  'login.status.generating': '正在生成二维码...',
  'login.status.scanQR': '请使用哔哩哔哩 APP 扫描二维码',
  'login.status.scanned': '已扫描，等待确认...',
  'login.status.success': '登录成功！',
  'login.status.expired': '二维码已过期，请重新生成',
  'login.status.timeout': '登录超时，请重试',
  'login.status.noCookies': '没有可导出的 Cookie',
  'login.status.imported': 'Cookie 已导入',
  'login.qr.hint': '使用哔哩哔哩 APP 扫描。',
  'login.qr.alt': '登录二维码',
  'login.import.invalidJSON': '无效文件：不是有效的 JSON',
  'login.import.invalidObject': '无效文件：期望一个 JSON 对象',
  'login.import.noSESSDATA': '无效文件：缺少 SESSDATA',
  'login.import.readError': '无法读取文件',
  'login.import.failed': '导入失败：{error}',

  // 第二部分：房间输入
  'room.title': '2. 输入直播间',
  'room.input.placeholder': 'live.bilibili.com/12345, b23.tv/XXXX, 或 12345',
  'room.btn.extract': '提取',
  'room.btn.extracting': '提取中...',
  'room.error.failed': '获取直播间信息失败',
  'room.error.streamsFailed': '获取流媒体失败',

  // 第三部分：结果
  'results.best.title': '最佳画质',
  'results.showAll': '显示所有画质',
  'results.room.liveNow': '直播中',
  'results.room.offline': '未开播',
  'results.room.meta': '房间 {roomId} · 主播：{anchor} · {status}',
  'results.copy': '复制',
  'results.copied': '已复制',
  'results.copyFailed': '失败',

  // 页脚
  'footer.disclaimer': '仅供个人使用。流媒体地址由哔哩哔哩签发，具有时效性。',
  'footer.openSource': '开源于',
  'footer.github': 'GitHub',
  'footer.welcome': '。欢迎 Star 和提交 Issue。',

  // 语言选择器
  'lang.selector': '语言',
  'lang.en': 'English',
  'lang.zh-cn': '简体中文',
  'lang.zh-hk': '繁體中文',
});
