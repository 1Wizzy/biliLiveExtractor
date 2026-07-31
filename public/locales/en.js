// English translations
window.i18n.loadLocale('en', {
  // Page title
  'page.title': 'Bilibili Live Stream Extractor',

  // Header
  'header.title': 'Bilibili Live Stream Extractor',
  'header.subtitle': 'Extract playable stream URLs from any Bilibili live room.',

  // Section 1: Login
  'login.title': '1. Log in (optional)',
  'login.hint': 'Login unlocks higher qualities (Original / 4K / Dolby). Your cookies stay in this browser and are only forwarded to Bilibili. You can export them to a JSON file for backup, or import a saved file to restore a session without scanning again.',
  'login.btn.generate': 'Generate login QR code',
  'login.btn.regenerate': 'Regenerate QR code',
  'login.btn.export': 'Export cookies',
  'login.btn.import': 'Import cookies',
  'login.btn.logout': 'Log out',
  'login.status.loggedIn': 'Logged in',
  'login.status.notLoggedIn': 'Not logged in',
  'login.status.generating': 'Generating QR code...',
  'login.status.scanQR': 'Scan the QR code with the Bilibili app',
  'login.status.scanned': 'Scanned, waiting for confirmation...',
  'login.status.success': 'Login successful!',
  'login.status.expired': 'QR code expired, please regenerate',
  'login.status.timeout': 'Login timed out, please try again',
  'login.status.noCookies': 'No cookies to export',
  'login.status.imported': 'Cookies imported',
  'login.qr.hint': 'Scan with the Bilibili mobile app.',
  'login.qr.alt': 'Login QR code',
  'login.import.invalidJSON': 'Invalid file: not valid JSON',
  'login.import.invalidObject': 'Invalid file: expected a JSON object',
  'login.import.noSESSDATA': 'Invalid file: missing SESSDATA',
  'login.import.readError': 'Could not read the file',
  'login.import.failed': 'Import failed: {error}',

  // Section 2: Room input
  'room.title': '2. Enter a live room',
  'room.input.placeholder': 'live.bilibili.com/12345, b23.tv/XXXX, or 12345',
  'room.btn.extract': 'Extract',
  'room.btn.extracting': 'Extracting...',
  'room.error.failed': 'Failed to fetch room info',
  'room.error.streamsFailed': 'Failed to fetch streams',

  // Section 3: Results
  'results.best.title': 'Best quality',
  'results.showAll': 'Show all qualities',
  'results.room.liveNow': 'Live now',
  'results.room.offline': 'Offline',
  'results.room.meta': 'Room {roomId} · Anchor: {anchor} · {status}',
  'results.copy': 'Copy',
  'results.copied': 'Copied',
  'results.copyFailed': 'Failed',

  // Footer
  'footer.disclaimer': 'For personal use. Stream URLs are time-limited and issued by Bilibili.',
  'footer.openSource': 'Open source on',
  'footer.github': 'GitHub',
  'footer.welcome': '. Stars and issues are welcome.',

  // Language selector
  'lang.selector': 'Language',
  'lang.en': 'English',
  'lang.zh-cn': '简体中文',
  'lang.zh-hk': '繁體中文',
});
