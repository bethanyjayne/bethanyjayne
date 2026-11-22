// Shared site behaviour and refinements.
// Load the shared visual overrides on every page so the header stays consistent.
// (Each page already links website-overrides.css in <head>; this is a safety net
// for any page that doesn't, without duplicating it when it's already present.)
if (!document.querySelector('link[data-site-overrides], link[href$="website-overrides.css"]')) {
  const overrides = document.createElement('link');
  overrides.rel = 'stylesheet';
  overrides.href = './website-overrides.css';
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

// Contact form: reveal the success note instead of a dead end (static site, no backend).
const form = document.querySelector('.contact-form');
const formSuccess = document.querySelector('.form-success');

if (form && formSuccess) {
  form.addEventListener('submit', (event) => {
    formSuccess.hidden = false;
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    event.preventDefault();
  });
}
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
  const link = rel && document.querySelector(`a.page-turn[rel="${rel}"]`);
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
const plates = [...document.querySelectorAll('.work-card')];
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
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    number.textContent = `Plate ${roman(current + 1)} of ${roman(plates.length)}`;
    title.textContent = card.querySelector('.work-label strong')?.textContent || '';
    meta.textContent = card.querySelector('.work-label span')?.textContent || '';
  };

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
// phone the whole page turns from its edge), then the next chapter loads and
// fades in from blank paper. Works in every modern browser.
// ---------------------------------------------------------------------------
function turnPage(href) {
  const chapters = ['index.html', 'about.html', 'childrens-books.html', 'contact.html'];
  const chapterOf = (url) => chapters.indexOf(url.pathname.split('/').pop() || 'index.html');
  const target = new URL(href, window.location.href);
  const from = chapterOf(new URL(window.location.href));
  const to = chapterOf(target);
  const pages = document.querySelector('.book-pages');
  const go = () => { window.location.href = target.href; };

  if (turnPage.busy) return;
  if (!pages || from < 0 || to < 0 || from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
  turnPage.busy = true;

  const backward = to < from;
  const single = window.matchMedia('(max-width: 760px)').matches;
  const rect = pages.getBoundingClientRect();
  const top = Math.max(rect.top, 0);
  const height = Math.min(rect.bottom, window.innerHeight) - top;
  const half = single ? rect.width : rect.width / 2;
  const leafLeft = single || backward ? rect.left : rect.left + half;
  const hinge = backward ? 'right' : 'left';

  const stage = document.createElement('div');
  stage.className = 'turn-stage';
  stage.setAttribute('aria-hidden', 'true');
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
    Object.assign(headerCopy.style, { position: 'absolute', left: `${rect.left - leafLeft}px`, top: `${headerRect.top - top}px`, width: `${rect.width}px`, visibility: 'visible' });
    front.appendChild(headerCopy);
  }

  const back = document.createElement('div');
  back.className = 'turn-face turn-face--back';
  leaf.append(front, back);
  stage.append(under, leaf);
  document.body.appendChild(stage);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('bj-page-turn', backward ? 'back' : 'forward'); } catch (error) { /* ignore */ }
    go();
  };
  leaf.addEventListener('transitionend', (event) => { if (event.propertyName === 'transform') finish(); });
  window.setTimeout(finish, 1100);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    stage.classList.add('is-turning');
    leaf.style.transform = `rotateY(${backward ? 180 : -180}deg)`;
  }));
}

// Coming back with the browser's Back button can restore a page mid-turn.
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  document.querySelectorAll('.turn-stage').forEach((stage) => stage.remove());
  document.documentElement.classList.remove('is-arriving');
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
    const link = document.querySelector(`a.page-turn[rel="${dx < 0 ? 'next' : 'prev'}"]`);
    if (link) turnPage(link.href);
  }, { passive: true });
})();

// Fetch the neighbouring chapters early so the next page is ready when it turns.
window.addEventListener('load', () => {
  document.querySelectorAll('a.page-turn[rel]').forEach((link) => {
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = link.href;
    document.head.appendChild(hint);
  });
});
