// Build entry. Imports the existing global-style scripts in their original
// load order so Vite can bundle and fingerprint (content-hash) them for
// production, while the source files themselves stay unchanged.
//
// Each imported file communicates via the `window.i18n` global and has no
// exports, so these are plain side-effect imports. This module also works when
// loaded natively (<script type="module">) without a build step.
import "./i18n.js";
import "./locales/en.js";
import "./locales/zh-cn.js";
import "./locales/zh-hk.js";
import "./app.js";
