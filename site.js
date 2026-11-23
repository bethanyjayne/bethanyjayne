// Shared site behaviour and refinements.
// Load the shared visual overrides on every page so the header stays consistent.
// (Each page already links website-overrides.css in <head>; this is a safety net
// for any page that doesn't, without duplicating it when it's already present.)
if (!document.querySelector('link[data-site-overrides], link[href$="website-overrides.css"]')) {
  const overrides = document.createElement('link');
  overrides.rel = 'stylesheet';
  overrides.href = '/website-overrides.css';
  overrides.dataset.siteOverrides = 'true';
  document.head.appendChild(overrides);
}

const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

// Contact form: there is no server behind this static site, so the form opens the
// visitor's email app with their message already written, ready to send.
const form = document.querySelector('.contact-form');
const formSuccess = document.querySelector('.form-success');

if (form && formSuccess) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const subject = `A story waiting to be drawn, from ${name}`;
    const body = `${message}\n\n${name}\n${email}`;
    window.location.href = `mailto:hello@bethanyjayne.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    formSuccess.hidden = false;
    formSuccess.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });
}

// Swipeable plate rows can be scrolled with the keyboard too.
document.querySelectorAll('.work-grid').forEach((grid) => {
  grid.tabIndex = 0;
  grid.setAttribute('role', 'region');
  grid.setAttribute('aria-label', 'Plates');
});
// Book page numbers: each section is a two-page spread (left = even, right = odd).
document.querySelectorAll('main > section').forEach((section, index) => {
  [['left', index * 2 + 2], ['right', index * 2 + 3]].forEach(([side, number]) => {
    const label = document.createElement('span');
    label.className = `page-num page-num--${side}`;
    label.setAttribute('aria-hidden', 'true');
    label.textContent = number;
    section.appendChild(label);
  });
});

// Arrow keys turn the pages, like the corner links.
document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (document.querySelector('dialog[open]')) return;
  if (event.target.closest('input, textarea, select, button, [contenteditable]')) return;
  const rel = { ArrowRight: 'next', ArrowLeft: 'prev' }[event.key];
  const link = rel && document.querySelector(`a[rel="${rel}"]`);
  if (link) turnPage(link.href);
});

// Pip hops when you say hello.
document.querySelectorAll('.pip').forEach((pip) => {
  const hop = () => {
    pip.classList.remove('is-hopping');
    void pip.offsetWidth;
    pip.classList.add('is-hopping');
  };
  pip.addEventListener('click', hop);
  pip.addEventListener('mouseenter', hop);
  pip.addEventListener('animationend', (event) => {
    if (event.animationName === 'pip-hop') pip.classList.remove('is-hopping');
  });
});

// Plate viewer: open any illustration large, step through with the arrow keys.
const plates = [...document.querySelectorAll('.work-card')].filter((card) => card.querySelector('img'));
if (plates.length && typeof HTMLDialogElement === 'function') {
  const roman = (n) => [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
    .reduce((out, [value, numeral]) => { while (n >= value) { out += numeral; n -= value; } return out; }, '');
  const viewer = document.createElement('dialog');
  viewer.className = 'plate-viewer';
  viewer.setAttribute('aria-label', 'Plate viewer');
  viewer.innerHTML = `
    <figure class="plate-viewer__figure">
      <img class="plate-viewer__img" alt="">
      <figcaption class="plate-viewer__caption">
        <span class="plate-viewer__num"></span>
        <strong class="plate-viewer__title"></strong>
        <span class="plate-viewer__meta"></span>
      </figcaption>
    </figure>
    <div class="plate-viewer__controls">
      <button type="button" data-step="-1">&larr; Previous plate</button>
      <button type="button" data-close>Close</button>
      <button type="button" data-step="1">Next plate &rarr;</button>
    </div>`;
  document.body.appendChild(viewer);

  const image = viewer.querySelector('.plate-viewer__img');
  const number = viewer.querySelector('.plate-viewer__num');
  const title = viewer.querySelector('.plate-viewer__title');
  const meta = viewer.querySelector('.plate-viewer__meta');
  let current = 0;

  const show = (index) => {
    current = (index + plates.length) % plates.length;
    const card = plates[current];
    const source = card.querySelector('img');
    image.src = source.dataset.full || source.currentSrc || source.src;
    image.alt = source.alt;
    number.textContent = `Plate ${roman(current + 1)} of ${roman(plates.length)}`;
    title.textContent = card.querySelector('.work-label strong')?.textContent || '';
    meta.textContent = card.querySelector('.work-label span')?.textContent || '';
    // Load the plates either side so stepping to them is instant.
    [current - 1, current + 1].forEach((i) => {
      const neighbour = plates[(i + plates.length) % plates.length].querySelector('img');
      const ahead = new Image();
      ahead.src = neighbour.dataset.full || neighbour.currentSrc || neighbour.src;
    });
  };

  // Swipe left or right in the viewer to move between plates.
  let swipeStart = null;
  viewer.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) { swipeStart = null; return; }
    swipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  viewer.addEventListener('touchend', (event) => {
    if (!swipeStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipeStart.x;
    const dy = touch.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) viewer.close();
  }, { passive: true });

  plates.forEach((card, index) => {
    const source = card.querySelector('img');
    const name = card.querySelector('.work-label strong')?.textContent || source.alt;
    source.tabIndex = 0;
    source.setAttribute('role', 'button');
    source.setAttribute('aria-label', `View plate ${roman(index + 1)}: ${name}`);
    const open = () => { show(index); viewer.showModal(); };
    source.addEventListener('click', open);
    source.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });

  viewer.addEventListener('click', (event) => {
    if (event.target === viewer || event.target.closest('[data-close]')) { viewer.close(); return; }
    const step = event.target.closest('[data-step]');
    if (step) show(current + Number(step.dataset.step));
  });
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
  });
  viewer.addEventListener('close', () => plates[current].querySelector('img').focus({ preventScroll: true }));
}


// ---------------------------------------------------------------------------
// Page turning between chapters. The visible page is copied onto a "leaf"
// that turns over the spine (right page forwards, left page backwards; on a
// phone the whole page turns from its edge). The next chapter is drawn
// underneath before the turn starts, so turning the page reveals the real next
// page (the right way round), and it is already there when it loads.
// Works in every modern browser.
// ---------------------------------------------------------------------------
function turnPage(href) {
  // Chapters live in their own folders (/about/, /otters/ ...); old .html
  // addresses still count as the same chapter.
  const chapters = ['', 'about', 'otters', 'pip', 'russel', 'contact'];
  const chapterOf = (url) => chapters.indexOf(url.pathname.replace(/(\/index)?\.html$|\/$/, '').split('/').pop());
  const target = new URL(href, window.location.href);
  const from = chapterOf(new URL(window.location.href));
  const to = chapterOf(target);
  const cover = document.querySelector('.cover');
  const pages = document.querySelector('.book-pages') || cover;
  const go = () => { window.location.href = target.href; };

  if (turnPage.busy) return;
  // No turning when the visitor asks for less motion (device setting or the accessibility panel).
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion');
  if (!pages || from < 0 || to < 0 || from === to || still) { go(); return; }
  turnPage.busy = true;
  // Draw the next page first (or give up after a moment and turn onto blank paper).
  const giveUp = new Promise((resolve) => { window.setTimeout(resolve, 700, null); });
  Promise.race([nextPageLayer(target.href), giveUp])
    .catch(() => null)
    .then((dest) => turnLeaf({ target, backward: to < from, cover, pages, go, dest }));
}

// The next chapter, laid out as it will look when it opens (scrolled to the top),
// in a layer the size of the screen. Resolves once its pictures on screen are ready.
const nextPages = new Map();
function fetchPage(href) {
  const url = new URL(href, window.location.href);
  url.hash = '';
  if (!nextPages.has(url.href)) {
    nextPages.set(url.href, fetch(url.href, { credentials: 'same-origin' })
      .then((response) => { if (!response.ok) throw new Error(response.status); return response.text(); })
      .catch((error) => { nextPages.delete(url.href); throw error; }));
  }
  return nextPages.get(url.href);
}
function nextPageLayer(href) {
  return fetchPage(href).then((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const layer = document.createElement('div');
    layer.className = `turn-dest ${doc.body.className}`;
    doc.body.querySelectorAll('script, dialog, .skip-link').forEach((el) => el.remove());
    doc.body.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    doc.body.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    doc.body.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    layer.append(...[...doc.body.childNodes].map((node) => document.importNode(node, true)));
    // Measure it off screen, then wait for the pictures that will be on screen.
    Object.assign(layer.style, { position: 'fixed', left: '0px', top: '0px', width: `${document.documentElement.clientWidth}px`, height: `${window.innerHeight}px`, visibility: 'hidden' });
    document.body.appendChild(layer);
    const onScreen = [...layer.querySelectorAll('img')].filter((img) => { const r = img.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight && r.width > 0; });
    return Promise.all(onScreen.map((img) => (img.decode ? img.decode() : Promise.resolve()).catch(() => {}))).then(() => {
      layer.remove();
      Object.assign(layer.style, { position: '', visibility: '' });
      return layer;
    });
  });
}

function turnLeaf({ target, backward, cover, pages, go, dest }) {

  const single = Boolean(cover) || window.matchMedia('(max-width: 900px), (max-height: 540px) and (orientation: landscape)').matches;
  const rect = pages.getBoundingClientRect();
  const top = Math.max(rect.top, 0);
  const height = Math.min(rect.bottom, window.innerHeight) - top;
  const half = single ? rect.width : rect.width / 2;
  const leafLeft = single || backward ? rect.left : rect.left + half;
  const hinge = backward ? 'right' : 'left';

  const stage = document.createElement('div');
  stage.className = 'turn-stage';
  stage.setAttribute('aria-hidden', 'true');
  if (cover) stage.classList.add('is-cover');
  stage.style.setProperty('--shade-dir', backward ? '270deg' : '90deg');
  stage.style.perspectiveOrigin = `${backward ? leafLeft + half : leafLeft}px 50%`;

  const box = (el) => Object.assign(el.style, { left: `${leafLeft}px`, top: `${top}px`, width: `${half}px`, height: `${height}px` });
  const under = document.createElement('div');
  under.className = 'turn-under';
  box(under);

  const leaf = document.createElement('div');
  leaf.className = 'turn-leaf';
  box(leaf);
  leaf.style.transformOrigin = `${hinge} center`;

  const front = document.createElement('div');
  front.className = 'turn-face turn-face--front';
  const copy = pages.cloneNode(true);
  copy.classList.add('turn-clone');
  // Only copy what is on screen: everything else becomes an empty spacer of the
  // same height, so long chapters turn as smoothly as short ones.
  const offscreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom < -60 || r.top > window.innerHeight + 60; };
  const spacer = (el) => { const blank = document.createElement('div'); blank.style.height = `${el.getBoundingClientRect().height}px`; return blank; };
  [['main', true], ['.site-footer', false]].forEach(([selector, byChild]) => {
    const original = pages.querySelector(selector);
    const copied = copy.querySelector(selector);
    if (!original || !copied) return;
    if (!byChild) { if (offscreen(original)) copied.replaceWith(spacer(original)); return; }
    [...original.children].forEach((child, index) => {
      if (offscreen(child) && copied.children[index]) copied.children[index].replaceWith(spacer(child));
    });
  });
  copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  copy.querySelectorAll('.page-turn, dialog').forEach((el) => el.remove());
  Object.assign(copy.style, { left: `${rect.left - leafLeft}px`, top: `${rect.top - top}px`, width: `${rect.width}px` });
  front.appendChild(copy);

  // The running head is pinned to the top of the screen, so copy it where it is now.
  const header = pages.querySelector('.site-header');
  if (header) {
    const headerRect = header.getBoundingClientRect();
    const headerCopy = header.cloneNode(true);
    headerCopy.classList.add('turn-clone');
    headerCopy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    Object.assign(headerCopy.style, { position: 'absolute', left: `${rect.left - leafLeft}px`, top: `${headerRect.top - top}px`, width: `${rect.width}px` });
    front.appendChild(headerCopy);
  }

  const back = document.createElement('div');
  back.className = 'turn-face turn-face--back';
  leaf.append(front, back);
  // The next page, positioned where it will sit on the screen. Underneath the
  // turning leaf it shows straight away; on a two-page spread the back of the
  // leaf carries the next page's left half (or right half when turning back),
  // laid out so it reads the right way round once the leaf has turned over.
  const place = (layer, originX, originY) => { Object.assign(layer.style, { left: `${-originX}px`, top: `${-originY}px` }); return layer; };
  if (dest && cover) {
    stage.classList.add('has-dest');
    stage.append(place(dest, 0, 0), under, leaf);
  } else if (dest) {
    stage.classList.add('has-dest');
    under.appendChild(place(dest, leafLeft, top));
    if (!single) back.appendChild(place(dest.cloneNode(true), backward ? leafLeft + half : leafLeft - half, top));
    stage.append(under, leaf);
  } else {
    stage.append(under, leaf);
  }
  document.body.appendChild(stage);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    // If the next page was already showing, it simply appears; otherwise it fades in from blank paper.
    try { sessionStorage.setItem('bj-page-turn', dest ? 'shown' : (backward ? 'back' : 'forward')); } catch (error) { /* ignore */ }
    go();
  };
  leaf.addEventListener('animationend', (event) => { if (event.animationName.startsWith('leaf-')) finish(); });
  window.setTimeout(finish, 950);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    // The leaf turns in two halves: the front shows until the page stands
    // upright on the spine, then only the blank back shows. This never relies
    // on backface-visibility, so the page can't show through onto the other side.
    stage.classList.toggle('is-backward', backward);
    stage.classList.add('is-turning');
    // Belt and braces: once the page stands upright on the spine, remove its
    // content entirely so nothing can ever show through back to front.
    window.setTimeout(() => { front.replaceChildren(); front.style.opacity = '0'; }, 345);
  }));
}

// Coming back with the browser's Back button can restore a page mid-turn.
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  document.querySelectorAll('.turn-stage').forEach((stage) => stage.remove());
  document.documentElement.classList.remove('is-arriving', 'is-turned');
  turnPage.busy = false;
});

// Every link to another chapter turns the page.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target === '_blank' || link.hasAttribute('download')) return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname === window.location.pathname || !/\.html$|\/$/.test(url.pathname)) return;
  event.preventDefault();
  turnPage(url.href);
});

// On a phone, swipe left or right across the page to turn it.
(() => {
  let start = null;
  document.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    start = event.touches.length === 1 && !event.target.closest('.work-grid, dialog, input, textarea')
      ? { x: touch.clientX, y: touch.clientY, time: Date.now() } : null;
  }, { passive: true });
  document.addEventListener('touchend', (event) => {
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const quick = Date.now() - start.time < 600;
    start = null;
    if (!quick || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    const link = document.querySelector(`a[rel="${dx < 0 ? 'next' : 'prev'}"]`);
    if (link) turnPage(link.href);
  }, { passive: true });
})();

// Fetch the neighbouring chapters early so the next page is ready when it turns.
window.addEventListener('load', () => {
  document.querySelectorAll('a[rel="next"], a[rel="prev"], .cover-tabs a').forEach((link) => {
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = link.href;
    document.head.appendChild(hint);
  });
  // Keep the neighbouring chapters' text ready, so the next page can be drawn under the turning one.
  const ready = () => document.querySelectorAll('a[rel="next"], a[rel="prev"], .cover-tabs a').forEach((link) => fetchPage(link.href).catch(() => {}));
  if ('requestIdleCallback' in window) window.requestIdleCallback(ready, { timeout: 2000 }); else window.setTimeout(ready, 600);
});

// Installable web app: keep the book available offline.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((reg) => reg.update()).catch(() => {}); });
}
