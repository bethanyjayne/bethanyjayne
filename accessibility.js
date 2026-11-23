// Accessibility settings: a small round button in the corner opens a page of
// reading preferences (larger text, a plainer font, stronger contrast,
// underlined links, less movement and plain backgrounds). Choices apply at once
// and are remembered on this device.
//
// This file loads in <head> without `defer`, so the saved choices are on the
// page before its first paint; the button and panel are added once the page
// has been read.
(() => {
  'use strict';
  const STORAGE_KEY = 'bj-accessibility-v1';
  const root = document.documentElement;
  const systemReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const defaults = Object.freeze({
    version: 1,
    largeText: false,
    readingFont: false,
    highContrast: false,
    underlineLinks: false,
    reduceMotion: false,
    simplifyBackgrounds: false,
  });
  const classMap = Object.freeze({
    largeText: 'a11y-large-text',
    readingFont: 'a11y-reading-font',
    highContrast: 'a11y-high-contrast',
    underlineLinks: 'a11y-underline-links',
    reduceMotion: 'a11y-reduce-motion',
    simplifyBackgrounds: 'a11y-simplify-backgrounds',
  });

  const sanitise = (candidate = {}) => Object.keys(defaults).reduce((clean, key) => {
    clean[key] = key === 'version' ? 1 : candidate[key] === true;
    return clean;
  }, {});

  const readSettings = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? sanitise(JSON.parse(raw)) : { ...defaults };
    } catch (error) {
      return { ...defaults };
    }
  };

  let settings = readSettings();
  const effectiveReduceMotion = () => settings.reduceMotion || systemReduceMotion.matches;

  const applySettings = () => {
    Object.entries(classMap).forEach(([key, className]) => {
      root.classList.toggle(className, key === 'reduceMotion' ? effectiveReduceMotion() : settings[key]);
    });
  };
  applySettings();

  const rows = [
    ['largeText', 'large-text', 'Larger text', 'Make the words bigger; the pages reflow to fit.'],
    ['readingFont', 'reading-font', 'Easy-reading font', 'Swap the storybook serif for a plain, open typeface.'],
    ['highContrast', 'high-contrast', 'Higher contrast', 'Darker words, firmer lines and solid labels.'],
    ['underlineLinks', 'underline-links', 'Underline links', 'Make every link easy to spot.'],
    ['reduceMotion', 'reduce-motion', 'Reduce motion', 'Pages change without turning; nothing hops or sweeps.'],
    ['simplifyBackgrounds', 'simplify-backgrounds', 'Plain backgrounds', 'Quiet, solid colour behind the book instead of painted scenery.'],
  ];

  const build = () => {
    if (document.getElementById('bj-accessibility-dialog') || !document.body) return;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'a11y-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'bj-accessibility-dialog');
    trigger.setAttribute('aria-label', 'Accessibility settings');
    trigger.title = 'Accessibility settings';
    trigger.innerHTML = '<svg class="a11y-trigger__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="4.2" r="2" fill="currentColor"/><path d="M4.5 8.2 12 10l7.5-1.8M12 10v5m0 0-3.8 5.6M12 15l3.8 5.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(trigger);

    // On a phone, tuck the button away while reading down the page and bring
    // it back on the way up (and at the top and bottom of the page).
    (() => {
      const phone = window.matchMedia('(max-width: 900px), (max-height: 540px) and (orientation: landscape)');
      let lastY = window.scrollY;
      let ticking = false;
      const set = (hide) => trigger.classList.toggle('is-tucked', hide);
      // Step aside while the 'Previous' / 'Next' page links pass underneath.
      const coversPageLink = () => {
        const t = trigger.getBoundingClientRect();
        const top = t.top - 24;
        const bottom = t.bottom + 24;
        return [...document.querySelectorAll('.page-turn')].some((link) => {
          const r = link.getBoundingClientRect();
          return r.width && r.right > t.left && r.left < t.right && r.bottom > top && r.top < bottom;
        });
      };
      const update = () => {
        ticking = false;
        const y = window.scrollY;
        const nearEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 80;
        if (phone.matches && coversPageLink()) set(true);
        else if (!phone.matches || y < 120 || nearEnd || trigger.matches(':focus-visible')) set(false);
        else if (y > lastY + 6) set(true);
        else if (y < lastY - 6) set(false);
        if (Math.abs(y - lastY) > 6) lastY = y;
      };
      window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
      }, { passive: true });
      trigger.addEventListener('focus', () => set(false));
      if (phone.addEventListener) phone.addEventListener('change', update);
      window.addEventListener('resize', update, { passive: true });
      update();
    })();

    const dialog = document.createElement('dialog');
    dialog.id = 'bj-accessibility-dialog';
    dialog.className = 'a11y-dialog';
    dialog.setAttribute('aria-labelledby', 'bj-accessibility-title');
    dialog.setAttribute('aria-describedby', 'bj-accessibility-intro');
    dialog.innerHTML = `
      <div class="a11y-sheet">
        <div class="a11y-top">
        <div class="a11y-head">
          <div>
            <p class="a11y-kicker">For every reader</p>
            <h2 id="bj-accessibility-title" tabindex="-1">Accessibility settings</h2>
          </div>
          <button type="button" class="a11y-close" aria-label="Close accessibility settings"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3 3 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
        </div>
        <p class="a11y-intro" id="bj-accessibility-intro">Make the book easier to read and use. Changes apply straight away and are remembered on this device.</p>
        </div>
        <div class="a11y-body">
          <fieldset class="a11y-list">
            <legend class="visually-hidden">Reading preferences</legend>
            ${rows.map(([key, id, label, description]) => `
            <label class="a11y-row" for="a11y-${id}">
              <span class="a11y-row__copy">
                <span class="a11y-row__title" id="a11y-${id}-label">${label}</span>
                <span class="a11y-row__description" id="a11y-${id}-description"${key === 'reduceMotion' ? ' data-motion-description' : ''}>${description}</span>
              </span>
              <span class="a11y-row__control"><input id="a11y-${id}" class="a11y-switch" type="checkbox" role="switch" data-a11y-setting="${key}" aria-labelledby="a11y-${id}-label" aria-describedby="a11y-${id}-description"><span class="a11y-switch__state" aria-hidden="true">Off</span></span>
            </label>`).join('')}
          </fieldset>
        </div>
        <div class="a11y-foot">
          <p class="a11y-status" role="status" aria-live="polite" aria-atomic="true" data-a11y-status></p>
          <button type="button" class="a11y-reset">Reset all</button>
          <button type="button" class="a11y-done">Done</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    const title = dialog.querySelector('#bj-accessibility-title');
    const status = dialog.querySelector('[data-a11y-status]');
    const motionControl = dialog.querySelector('[data-a11y-setting="reduceMotion"]');
    const motionDescription = dialog.querySelector('[data-motion-description]');
    const motionText = motionDescription.textContent;
    const controls = [...dialog.querySelectorAll('[data-a11y-setting]')];
    let returnFocus = null;

    const announce = (message) => {
      status.textContent = '';
      window.requestAnimationFrame(() => { status.textContent = message; });
    };

    const syncControls = () => {
      controls.forEach((control) => {
        const key = control.dataset.a11ySetting;
        control.checked = key === 'reduceMotion' ? effectiveReduceMotion() : settings[key] === true;
        control.closest('.a11y-row__control').querySelector('.a11y-switch__state').textContent = control.checked ? 'On' : 'Off';
      });
      motionControl.disabled = systemReduceMotion.matches;
      motionDescription.textContent = systemReduceMotion.matches ? 'Your device is already reducing motion.' : motionText;
      motionDescription.classList.toggle('a11y-system-note', systemReduceMotion.matches);
    };

    const saveSettings = () => {
      let saved = false;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        saved = true;
      } catch (error) {
        // Storage can be blocked (private mode); the choice still applies now.
      }
      announce(saved ? 'Saved' : 'Applied for this visit');
      applySettings();
      syncControls();
    };

    const openDialog = () => {
      if (typeof dialog.showModal !== 'function') return;
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
      syncControls();
      status.textContent = '';
      root.classList.add('a11y-panel-open');
      dialog.showModal();
      dialog.querySelector('.a11y-body').scrollTop = 0;
      window.requestAnimationFrame(() => title.focus({ preventScroll: true }));
    };
    const closeDialog = () => { if (dialog.open) dialog.close(); };

    trigger.addEventListener('click', openDialog);
    controls.forEach((control) => {
      control.addEventListener('change', () => {
        const key = control.dataset.a11ySetting;
        if (key === 'reduceMotion' && systemReduceMotion.matches) { syncControls(); return; }
        settings[key] = control.checked;
        saveSettings();
      });
    });
    dialog.querySelector('.a11y-reset').addEventListener('click', () => {
      settings = { ...defaults };
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignore */ }
      applySettings();
      syncControls();
      announce('All settings reset');
    });
    dialog.querySelector('.a11y-close').addEventListener('click', closeDialog);
    dialog.querySelector('.a11y-done').addEventListener('click', closeDialog);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener('close', () => {
      root.classList.remove('a11y-panel-open');
      const target = [returnFocus, trigger].find((el) => el && document.contains(el) && el.getClientRects().length);
      returnFocus = null;
      if (target) window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    });

    const refresh = () => { applySettings(); syncControls(); };
    if (systemReduceMotion.addEventListener) systemReduceMotion.addEventListener('change', refresh);
    else if (systemReduceMotion.addListener) systemReduceMotion.addListener(refresh);
    // Keep other open pages of the book in step.
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      settings = readSettings();
      refresh();
    });
    // Coming back with the Back button can show a saved copy of the page.
    window.addEventListener('pageshow', (event) => {
      if (!event.persisted) return;
      settings = readSettings();
      refresh();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
