(function () {
  // Keep this list aligned with fill_all_projects_ollama.py. Translation files
  // are loaded from ./i18n/{lang}.js or ./i18n/ollama_{lang}.js.
  const LANGUAGE_OPTIONS = Object.freeze([
    { code: "en", name: "English" },
    { code: "ko", name: "한국어" },
    { code: "af", name: "Afrikaans" },
    { code: "am", name: "አማርኛ" },
    { code: "ar", name: "العربية" },
    { code: "az", name: "Azərbaycan dili" },
    { code: "be", name: "Беларуская" },
    { code: "bg", name: "Български" },
    { code: "bn", name: "বাংলা" },
    { code: "bs", name: "Bosanski" },
    { code: "ca", name: "Català" },
    { code: "cs", name: "Čeština" },
    { code: "da", name: "Dansk" },
    { code: "de", name: "Deutsch" },
    { code: "el", name: "Ελληνικά" },
    { code: "es", name: "Español" },
    { code: "es-MX", name: "Español (México)" },
    { code: "es-US", name: "Español (Estados Unidos)" },
    { code: "et", name: "Eesti" },
    { code: "fa", name: "فارسی" },
    { code: "fi", name: "Suomi" },
    { code: "fil", name: "Filipino" },
    { code: "fr", name: "Français" },
    { code: "fr-CA", name: "Français (Canada)" },
    { code: "gu", name: "ગુજરાતી" },
    { code: "ha", name: "Hausa" },
    { code: "he", name: "עברית" },
    { code: "hi", name: "हिन्दी" },
    { code: "hr", name: "Hrvatski" },
    { code: "hu", name: "Magyar" },
    { code: "hy", name: "Հայերեն" },
    { code: "id", name: "Bahasa Indonesia" },
    { code: "ig", name: "Igbo" },
    { code: "it", name: "Italiano" },
    { code: "ja", name: "日本語" },
    { code: "ka", name: "ქართული" },
    { code: "kk", name: "Қазақ тілі" },
    { code: "kn", name: "ಕನ್ನಡ" },
    { code: "ln", name: "Lingála" },
    { code: "lt", name: "Lietuvių" },
    { code: "lv", name: "Latviešu" },
    { code: "mk", name: "Македонски" },
    { code: "ml", name: "മലയാളം" },
    { code: "mn", name: "Монгол" },
    { code: "mr", name: "मराठी" },
    { code: "ms", name: "Bahasa Melayu" },
    { code: "my", name: "မြန်မာ" },
    { code: "nb", name: "Norsk bokmål" },
    { code: "ne", name: "नेपाली" },
    { code: "nl", name: "Nederlands" },
    { code: "om", name: "Afaan Oromoo" },
    { code: "or", name: "ଓଡ଼ିଆ" },
    { code: "pa", name: "ਪੰਜਾਬੀ" },
    { code: "pcm", name: "Naijá Píjin" },
    { code: "pl", name: "Polski" },
    { code: "pt-BR", name: "Português (Brasil)" },
    { code: "pt-PT", name: "Português (Portugal)" },
    { code: "ro", name: "Română" },
    { code: "ru", name: "Русский" },
    { code: "rw", name: "Ikinyarwanda" },
    { code: "si", name: "සිංහල" },
    { code: "sk", name: "Slovenčina" },
    { code: "sl", name: "Slovenščina" },
    { code: "so", name: "Soomaali" },
    { code: "sq", name: "Shqip" },
    { code: "sr", name: "Српски" },
    { code: "st", name: "Sesotho" },
    { code: "sv", name: "Svenska" },
    { code: "sw", name: "Kiswahili" },
    { code: "ta", name: "தமிழ்" },
    { code: "te", name: "తెలుగు" },
    { code: "th", name: "ไทย" },
    { code: "ti", name: "ትግርኛ" },
    { code: "tr", name: "Türkçe" },
    { code: "ts", name: "XiTsonga" },
    { code: "uk", name: "Українська" },
    { code: "ur", name: "اردو" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "yo", name: "Yorùbá" },
    { code: "zh-HK", name: "繁體中文（香港）" },
    { code: "zh-Hans", name: "简体中文" },
    { code: "zh-Hant", name: "繁體中文" },
    { code: "zu", name: "isiZulu" }
  ]);
  const pageLanguageCodes = (document.documentElement.dataset.i18nLanguages || "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
  const ACTIVE_LANGUAGE_OPTIONS = pageLanguageCodes.length
    ? LANGUAGE_OPTIONS.filter((item) => pageLanguageCodes.includes(item.code))
    : LANGUAGE_OPTIONS;
  const SUPPORTED = ACTIVE_LANGUAGE_OPTIONS.map((item) => item.code);
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
    document.dispatchEvent(new CustomEvent("ocrbook:languagechange", {
      detail: { language: lang }
    }));
  }

  // Shared public API used by lang-selector.js. This removes the old
  // dependency on one hidden HTML button per language.
  window.OCRBookI18n = Object.freeze({
    languages: ACTIVE_LANGUAGE_OPTIONS,
    supported: Object.freeze([...SUPPORTED]),
    normalize,
    setLang
  });

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
        ACTIVE_LANGUAGE_OPTIONS.forEach(({ code, name }) => {
          const opt = document.createElement("option");
          opt.value = code;
          opt.textContent = `${name} (${code})`;
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
