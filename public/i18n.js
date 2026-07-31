// Simple i18n library for static sites
class I18n {
  constructor() {
    this.locale = this.getSavedLocale() || this.detectLocale();
    this.translations = {};
    this.fallbackLocale = 'en';
  }

  // Detect browser language
  detectLocale() {
    const lang = navigator.language || navigator.userLanguage || 'en';
    const lower = lang.toLowerCase();

    // Map browser locales to supported locales
    if (lower.startsWith('zh-hk') || lower.startsWith('zh-tw')) return 'zh-hk';
    if (lower.startsWith('zh')) return 'zh-cn';
    return 'en';
  }

  // Get saved locale from localStorage
  getSavedLocale() {
    try {
      return localStorage.getItem('locale');
    } catch {
      return null;
    }
  }

  // Save locale to localStorage
  saveLocale(locale) {
    try {
      localStorage.setItem('locale', locale);
    } catch {
      // Ignore localStorage errors
    }
  }

  // Load translations for a locale
  async loadLocale(locale, translations) {
    this.translations[locale] = translations;
  }

  // Set current locale
  setLocale(locale) {
    this.locale = locale;
    this.saveLocale(locale);
    this.updatePage();
  }

  // Get translation by key
  t(key, params = {}) {
    let text = this.translations[this.locale]?.[key]
            || this.translations[this.fallbackLocale]?.[key]
            || key;

    // Replace parameters like {name}
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });

    return text;
  }

  // Update all elements with data-i18n attribute
  updatePage() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Update title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });

    // Update alt text
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const key = el.getAttribute('data-i18n-alt');
      el.alt = this.t(key);
    });

    // Update document title
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) {
      const key = titleEl.getAttribute('data-i18n');
      document.title = this.t(key);
    }

    // Update html lang attribute
    document.documentElement.lang = this.locale;
  }

  // Get current locale
  getLocale() {
    return this.locale;
  }
}

// Global instance
window.i18n = new I18n();
