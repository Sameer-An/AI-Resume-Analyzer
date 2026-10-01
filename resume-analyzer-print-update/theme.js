/* Appearance only. No form, upload, API, result or application event handlers. */
(() => {
  'use strict';
  const storageKey = 'resume-analyzer-theme';
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let explicitTheme = null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') explicitTheme = saved;
  } catch (_) { /* Theme still works when browser storage is unavailable. */ }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    const button = document.getElementById('themeToggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
  }
  const currentTheme = () => explicitTheme || (preference.matches ? 'dark' : 'light');
  applyTheme(currentTheme());

  function initialise() {
    applyTheme(currentTheme());
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      explicitTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(explicitTheme);
      try { localStorage.setItem(storageKey, explicitTheme); } catch (_) {}
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else initialise();
  preference.addEventListener('change', () => {
    if (!explicitTheme) applyTheme(currentTheme());
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    explicitTheme = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    applyTheme(currentTheme());
  });
})();
