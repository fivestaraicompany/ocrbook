(function () {
  // Supported language codes for this site.
  // Add/Remove codes here only; translation files are loaded from ./i18n/{lang}.(json|js)
  const SUPPORTED = ['en', 'ko', 'uk', 'ar', 'ca', 'zh-Hans', 'zh-Hant', 'hr', 'cs', 'da', 'nl', 'fi', 'fr', 'de', 'el', 'fr-CA', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ms', 'nb', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'es-MX', 'es', 'sv', 'th', 'tr', 'vi'];
  const STORAGE_KEY = "ocrbook_lang";

  // Get namespace prefix from script tag (e.g., data-i18n-prefix="ollama")
  // Try multiple methods to find the script tag
  let scriptTag = document.currentScript;
  if (!scriptTag) {
    // Fallback: find script tag with data-i18n-prefix attribute
    const scripts = document.querySelectorAll('script[data-i18n-prefix]');
    scriptTag = scripts[scripts.length - 1]; // Get the last one (most recent)
  }
  const PREFIX = scriptTag ? (scriptTag.getAttribute('data-i18n-prefix') || '') : '';
  const BASE_PATH = PREFIX ? '../i18n' : './i18n'; // Tutorial pages are in subdirectory

  // Precompute a case-insensitive lookup table, while preserving original casing
  const SUPPORTED_LC = SUPPORTED.map((x) => x.toLowerCase());
  const CANONICAL = new Map(SUPPORTED_LC.map((lc, i) => [lc, SUPPORTED[i]]));

  function normalize(lang) {
    if (!lang) return "en";

    // Normalize separators and casing, keep BCP-47 style (-)
    lang = String(lang).trim().replace(/_/g, "-");

    // Common browser forms like "ko-KR", "pt-BR", "zh-Hans-CN"
    const lc = lang.toLowerCase();

    // 1) exact match (case-insensitive)
    if (CANONICAL.has(lc)) return CANONICAL.get(lc);

    // 2) try progressively stripping subtags: e.g. "fr-CA-x-private" -> "fr-CA" -> "fr"
    const parts = lc.split("-");
    for (let i = parts.length; i > 0; i--) {
      const candidate = parts.slice(0, i).join("-");
      if (CANONICAL.has(candidate)) return CANONICAL.get(candidate);
    }

    // 3) special handling for Chinese legacy/region tags
    //    If your build only provides zh-Hans / zh-Hant, map common region tags.
    if (lc.startsWith("zh")) {
      // Simplified: zh-CN, zh-SG
      if (lc.includes("-cn") || lc.includes("-sg")) return "zh-Hans";
      // Traditional: zh-TW, zh-HK, zh-MO
      if (lc.includes("-tw") || lc.includes("-hk") || lc.includes("-mo")) return "zh-Hant";
      // If unknown, prefer Simplified
      return "zh-Hans";
    }

    // Fallback
    return "en";
  }

  function apply(dict) {
    // Content nodes: allow simple HTML (e.g. <strong>, <em>, <code>) from trusted translations
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) {
        el.innerHTML = dict[key];
      }
    });

    // Attribute translations stay as plain text
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      const [attr, key] = spec.split(":");
      if (attr && key && dict[key] != null) el.setAttribute(attr, dict[key]);
    });

    if (dict.meta_title) document.title = dict.meta_title;
  }


  function loadFromWindow(lang) {
    const store = window.__OCRBOOK_I18N || {};
    const key = PREFIX ? `${PREFIX}_${lang}` : lang;
    return store[key] || null;
  }

  function loadScript(lang) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      const filename = PREFIX ? `${PREFIX}_${lang}` : lang;
      s.src = `${BASE_PATH}/${filename}.js`;
      s.async = true;
      s.onload = () => resolve(loadFromWindow(lang));
      s.onerror = () => reject(new Error("script load failed"));
      document.head.appendChild(s);
    });
  }

  async function load(lang) {
    // 1) if already present, use it
    const existing = loadFromWindow(lang);
    if (existing) return existing;

    // 2) try fetch (works on http/https)
    try {
      const filename = PREFIX ? `${PREFIX}_${lang}` : lang;
      const res = await fetch(`${BASE_PATH}/${filename}.json`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load i18n: ${filename}`);
      return await res.json();
    } catch (_) {
      // 3) fallback to script (works on file://)
      const viaScript = await loadScript(lang);
      if (viaScript) return viaScript;
      throw new Error("No i18n data");
    }
  }

  async function setLang(lang) {
    lang = normalize(lang);
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.setAttribute(
        "aria-pressed",
        normalize(btn.getAttribute("data-lang-btn")) === lang ? "true" : "false"
      );
    });

    // Handle langSelect dropdown (used in tutorial page)
    const langSelect = document.getElementById("langSelect");
    if (langSelect) {
      langSelect.value = lang;
    }

    try {
      const dict = await load(lang);
      apply(dict);
    } catch (e) {
      // Always fallback to English if anything goes wrong
      const dict = await load("en");
      apply(dict);
    }
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const browser = navigator.language || navigator.userLanguage || "en";
    const initial = normalize(saved || browser);

    // Language button handlers
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang-btn")));
    });

    // Language select dropdown handler (used in tutorial page)
    const langSelect = document.getElementById("langSelect");
    if (langSelect) {
      langSelect.addEventListener("change", () => setLang(langSelect.value));
      // Populate select if empty
      if (langSelect.options.length === 0) {
        SUPPORTED.forEach((code) => {
          const opt = document.createElement("option");
          opt.value = code;
          opt.textContent = code;
          langSelect.appendChild(opt);
        });
      }
    }

    setLang(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();