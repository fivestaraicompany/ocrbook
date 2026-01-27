// Common language selector module
// Provides a unified language selection UI for all pages

(function () {
  const SUPPORTED = [
    { code: "en", name: "English" },
    { code: "ko", name: "한국어" },
    { code: "uk", name: "Українська" },
    { code: "ar", name: "العربية" },
    { code: "ca", name: "Català" },
    { code: "zh-Hans", name: "简体中文" },
    { code: "zh-Hant", name: "繁體中文" },
    { code: "hr", name: "Hrvatski" },
    { code: "cs", name: "Čeština" },
    { code: "da", name: "Dansk" },
    { code: "nl", name: "Nederlands" },
    { code: "fi", name: "Suomi" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "el", name: "Ελληνικά" },
    { code: "fr-CA", name: "Français (Canada)" },
    { code: "he", name: "עברית" },
    { code: "hi", name: "हिन्दी" },
    { code: "hu", name: "Magyar" },
    { code: "id", name: "Bahasa Indonesia" },
    { code: "it", name: "Italiano" },
    { code: "ja", name: "日本語" },
    { code: "ms", name: "Bahasa Melayu" },
    { code: "nb", name: "Norsk bokmål" },
    { code: "pl", name: "Polski" },
    { code: "pt-BR", name: "Português (Brasil)" },
    { code: "pt-PT", name: "Português (Portugal)" },
    { code: "ro", name: "Română" },
    { code: "ru", name: "Русский" },
    { code: "sk", name: "Slovenčina" },
    { code: "es-MX", name: "Español (México)" },
    { code: "es", name: "Español" },
    { code: "sv", name: "Svenska" },
    { code: "th", name: "ไทย" },
    { code: "tr", name: "Türkçe" },
    { code: "vi", name: "Tiếng Việt" }
  ];

  function initLangSelector() {
    const openBtn = document.getElementById("langOpen");
    const dialog = document.getElementById("langDialog");
    const list = document.getElementById("langList");
    const search = document.getElementById("langSearch");
    const current = document.getElementById("langCurrent");

    if (!openBtn || !dialog || !list || !search || !current) return;

    function getCurrentLang() {
      const pressed = document.querySelector('[data-lang-btn][aria-pressed="true"]');
      return pressed ? pressed.getAttribute("data-lang-btn") : "en";
    }

    function setCurrentLabel() {
      const lang = getCurrentLang();
      const item = SUPPORTED.find(x => x.code === lang);
      current.textContent = item ? item.code.toUpperCase() : lang.toUpperCase();
    }

    function render(filterText) {
      const q = (filterText || "").trim().toLowerCase();
      const cur = getCurrentLang();
      list.innerHTML = "";

      const items = SUPPORTED.filter(x => {
        if (!q) return true;
        return (x.code.toLowerCase().includes(q) || x.name.toLowerCase().includes(q));
      });

      for (const x of items) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lang-item";
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", x.code === cur ? "true" : "false");
        btn.innerHTML = `
          <div>
            <div class="lang-name">${escapeHtml(x.name)}</div>
            <div class="lang-code">${escapeHtml(x.code)}</div>
          </div>
          <div aria-hidden="true">${x.code === cur ? "✓" : ""}</div>
        `;
        btn.addEventListener("click", () => {
          const hidden = document.querySelector(`[data-lang-btn="${cssEscape(x.code)}"]`);
          if (hidden) hidden.click();
          setCurrentLabel();
          if (dialog.open) dialog.close();
          openBtn.setAttribute("aria-expanded", "false");
        });
        list.appendChild(btn);
      }

      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "muted";
        empty.style.padding = "10px 6px 6px";
        empty.textContent = "No matches";
        list.appendChild(empty);
      }
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    }
    function cssEscape(s) {
      return String(s).replace(/"/g, '\\"');
    }

    openBtn.addEventListener("click", () => {
      openBtn.setAttribute("aria-expanded", "true");
      render("");
      search.value = "";
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
        setTimeout(() => search.focus(), 50);
      } else {
        alert("Your browser does not support <dialog>. Please update your browser.");
      }
    });

    dialog.addEventListener("close", () => {
      openBtn.setAttribute("aria-expanded", "false");
    });

    search.addEventListener("input", (e) => {
      render(e.target.value || "");
    });

    // Initialize current label
    setCurrentLabel();
    
    // Update label when language changes (listen for i18n changes)
    const observer = new MutationObserver(() => {
      setCurrentLabel();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-pressed'],
      subtree: true
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLangSelector);
  } else {
    initLangSelector();
  }
})();

