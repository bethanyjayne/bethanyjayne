// "A new edition is ready": when the site is redeployed while someone has it
// open (or their browser kept an older copy), offer a gentle refresh so they
// see the pages as they are now, not a stale mix of old and new files.
//
// How it works: the deploy workflow stamps this file with the build id and
// writes the same id to /version.json. This page remembers the id it was
// built with; it checks /version.json (never cached) on load, when the tab
// comes back into view, and every 15 minutes. A different id means a newer
// edition is live.
(() => {
  const BUILD = '__SITE_BUILD__';
  if (BUILD.startsWith('__') || !('fetch' in window) || location.protocol === 'file:') return;

  const CHECK_EVERY = 15 * 60 * 1000;
  const store = {
    get: (key) => { try { return sessionStorage.getItem(key); } catch (e) { return null; } },
    set: (key, value) => { try { sessionStorage.setItem(key, value); } catch (e) { /* private mode */ } },
  };
  let shown = false;
  let lastCheck = 0;

  const check = () => {
    if (shown || !navigator.onLine || document.visibilityState === 'hidden') return;
    lastCheck = Date.now();
    fetch(`/version.json?t=${lastCheck}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const latest = data && data.version;
        if (!latest || latest === BUILD) return;
        // Don't nag: skip an edition they chose "Later" for, or one a refresh
        // already tried to load (the CDN can take a minute to catch up).
        if (store.get('bj-update-later') === latest || store.get('bj-update-tried') === latest) return;
        show(latest);
      })
      .catch(() => {});
  };

  const css = `
.update-note { position: fixed; z-index: 960; left: max(1.25rem, env(safe-area-inset-left)); bottom: max(1.25rem, env(safe-area-inset-bottom)); width: min(23rem, calc(100vw - 2.5rem)); padding: 1.05rem 1.2rem 1.1rem 1.35rem; border: 1px solid rgba(31, 35, 64, .16); border-radius: 6px; color: var(--ink, #1f2340); background: var(--paper, #fcf7ee); box-shadow: inset 3px 0 0 #6d4c9c, 0 18px 40px -14px rgba(5, 12, 40, .55), 0 2px 6px rgba(5, 12, 40, .12); font-family: var(--serif, 'EB Garamond', Garamond, serif); line-height: 1.4; text-align: left; opacity: 0; transform: translateY(.9rem); transition: opacity .35s ease, transform .45s cubic-bezier(.2, .9, .25, 1.05); }
.update-note.is-shown { opacity: 1; transform: none; }
.update-note__eyebrow { margin: 0 0 .15rem; color: #6d4c9c; font-size: .95rem; font-style: italic; letter-spacing: .02em; }
.update-note__title { margin: 0; font-size: 1.3rem; font-weight: 500; line-height: 1.2; }
.update-note__text { margin: .3rem 0 .9rem; color: var(--ink-soft, #3f4260); font-size: 1.05rem; }
.update-note__actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1.1rem; }
.update-note__refresh { display: inline-flex; align-items: center; gap: .5rem; min-height: 2.75rem; padding: .45rem 1.25rem .55rem; border: 1px solid var(--sky, #1c41a2); border-radius: 3px; color: #fff; background: var(--sky, #1c41a2); font: inherit; font-size: 1.1rem; cursor: pointer; transition: background-color .2s ease, border-color .2s ease; }
.update-note__refresh:hover { border-color: var(--sky-deep, #14308a); background: var(--sky-deep, #14308a); }
.update-note__refresh svg { width: 1.05rem; height: 1.05rem; flex: none; }
.update-note__refresh[aria-busy="true"] svg { animation: update-note-spin .9s linear infinite; }
.update-note__later { min-height: 2.75rem; padding: 0 .2rem; border: 0; color: var(--muted, #6f6a78); background: none; font: inherit; font-size: 1.05rem; text-decoration: underline; text-decoration-color: rgba(109, 76, 156, .35); text-underline-offset: .2em; cursor: pointer; }
.update-note__later:hover { color: var(--ink, #1f2340); text-decoration-color: #6d4c9c; }
.update-note button:focus-visible { outline: 2px solid #6d4c9c; outline-offset: 3px; }
@keyframes update-note-spin { to { transform: rotate(360deg); } }
@media (max-width: 900px), (max-height: 540px) and (orientation: landscape) {
  .update-note { left: max(.9rem, env(safe-area-inset-left)); bottom: calc(4.4rem + env(safe-area-inset-bottom) + .8rem); width: auto; right: calc(max(.9rem, env(safe-area-inset-right)) + 3.7rem); max-width: 23rem; }
}
@media (max-height: 540px) and (orientation: landscape) { .update-note { bottom: calc(3.3rem + env(safe-area-inset-bottom) + .6rem); } }
@media (max-width: 380px) { .update-note { padding: .9rem 1rem 1rem 1.15rem; } .update-note__title { font-size: 1.2rem; } }
@media (prefers-reduced-motion: reduce) { .update-note { transition: opacity .2s ease; transform: none; } .update-note__refresh[aria-busy="true"] svg { animation: none; } }
html.a11y-reduce-motion .update-note { transition: opacity .2s ease; transform: none; }
html.a11y-reduce-motion .update-note__refresh[aria-busy="true"] svg { animation: none; }
html.a11y-high-contrast .update-note { border: 2px solid currentColor; }
html.a11y-panel-open .update-note { visibility: hidden; }
`;

  const show = (latest) => {
    shown = true;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const note = document.createElement('section');
    note.className = 'update-note';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-label', 'Website updated');
    note.innerHTML = `
      <p class="update-note__eyebrow">A new edition</p>
      <p class="update-note__title">This website has been updated</p>
      <p class="update-note__text">Refresh to see the latest pages.</p>
      <div class="update-note__actions">
        <button type="button" class="update-note__refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg>
          Refresh
        </button>
        <button type="button" class="update-note__later">Later</button>
      </div>`;
    document.body.appendChild(note);
    requestAnimationFrame(() => requestAnimationFrame(() => note.classList.add('is-shown')));

    const refresh = note.querySelector('.update-note__refresh');
    refresh.addEventListener('click', () => {
      refresh.setAttribute('aria-busy', 'true');
      refresh.disabled = true;
      store.set('bj-update-tried', latest);
      // Fetch the new offline copy too, then reload (pages, styles and scripts
      // are always fetched fresh by the service worker).
      const reload = () => location.reload();
      const sw = navigator.serviceWorker;
      if (!sw) return reload();
      Promise.race([
        sw.getRegistration().then((reg) => reg && reg.update()),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]).then(reload, reload);
    });

    note.querySelector('.update-note__later').addEventListener('click', () => {
      store.set('bj-update-later', latest);
      note.classList.remove('is-shown');
      setTimeout(() => note.remove(), 400);
    });
  };

  if (document.readyState === 'complete') setTimeout(check, 2500);
  else window.addEventListener('load', () => setTimeout(check, 2500));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheck > 60 * 1000) check();
  });
  window.addEventListener('online', check);
  setInterval(check, CHECK_EVERY);
})();
