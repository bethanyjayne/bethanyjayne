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
  // Only sections still below the screen fade in as they arrive; anything
  // already on screen when the page opens is shown at once, so a page never
  // flashes blank paper before its opening picture and words appear.
  reveals.forEach((element) => {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('is-pending');
      observer.observe(element);
    } else {
      element.classList.add('is-visible');
    }
  });
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
    window.location.href = `mailto:bethanyjayneillustrations@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
    // Show the picture already on the page straight away (it is loaded), then
    // swap in the large one once it has arrived, so the viewer never shows the
    // previous plate under the new caption on a slow connection.
    const shown = source.currentSrc || source.src;
    const full = source.dataset.full || shown;
    image.src = shown;
    image.alt = source.alt;
    if (full !== shown) {
      const large = new Image();
      large.onload = () => { if (plates[current] === card) image.src = full; };
      large.src = full;
    }
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
  const chapters = ['', 'about', 'otters', 'pip', 'russell', 'contact'];
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
  // Settle any tilt first, so the book turns from where it really lies.
  document.querySelectorAll('.cover-book').forEach((book) => { book.classList.remove('is-tilting'); book.style.transition = 'none'; book.style.setProperty('--rx', '0deg'); book.style.setProperty('--ry', '0deg'); });
  // Draw the next page first (or give up after a moment and turn onto blank paper).
  const giveUp = new Promise((resolve) => { window.setTimeout(resolve, 400, null); });
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
    layer.dataset.page = doc.body.className;
    doc.body.querySelectorAll('script, dialog, .skip-link').forEach((el) => el.remove());
    doc.body.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    doc.body.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    doc.body.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    layer.append(...[...doc.body.childNodes].map((node) => document.importNode(node, true)));
    // Measure it off screen, then wait for the pictures that will be on screen.
    Object.assign(layer.style, { position: 'fixed', left: '0px', top: '0px', width: `${document.documentElement.clientWidth}px`, height: `${window.innerHeight}px`, visibility: 'hidden' });
    document.body.appendChild(layer);
    // Keep only what is on screen; everything below becomes an empty spacer of
    // the same height, so the first frame of the turn is quick to draw.
    const below = (el) => el.getBoundingClientRect().top > window.innerHeight + 60;
    const spacer = (el) => { const blank = document.createElement('div'); blank.style.height = `${el.getBoundingClientRect().height}px`; return blank; };
    [...layer.querySelectorAll('main > *, .site-footer')].filter(below).forEach((el) => el.replaceWith(spacer(el)));
    const book = layer.querySelector('.book-pages');
    if (book) { const r = book.getBoundingClientRect(); layer.dataset.book = JSON.stringify([r.left, r.top, r.width, r.height]); }
    const coverBoard = layer.querySelector('.cover');
    if (coverBoard) { const r = coverBoard.getBoundingClientRect(); layer.dataset.cover = JSON.stringify([r.left, r.top, r.width, r.height]); }
    const onScreen = [...layer.querySelectorAll('img')].filter((img) => { const r = img.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight && r.width > 0; });
    return Promise.all(onScreen.map((img) => (img.decode ? img.decode() : Promise.resolve()).catch(() => {}))).then(() => {
      layer.remove();
      Object.assign(layer.style, { position: '', visibility: '' });
      return layer;
    });
  });
}

function turnLeaf({ target, backward, cover, pages, go, dest }) {
  if (dest && !cover && dest.dataset.cover && document.body.animate) { closeBook({ pages, go, dest }); return; }

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
  if (cover) {
    stage.classList.add('is-cover');
    // The chapter tabs and the hint beside the cover step back as it opens.
    document.querySelectorAll('.cover-tabs, .cover-hint').forEach((el) => {
      if (el.animate) el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
    });
  }
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
  // The copied pictures are already loaded: draw them in the very first frame
  // rather than leaving a blank space while they decode again.
  copy.querySelectorAll('img').forEach((img) => { img.decoding = 'sync'; img.loading = 'eager'; });
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
  // The book stays the same book: only the world around it changes, so the
  // next chapter's painting fades in behind the book while the page turns.
  if (dest) {
    const world = document.createElement('div');
    world.className = `turn-world ${dest.dataset.page}`;
    if (cover) world.classList.add('is-waiting');
    world.setAttribute('aria-hidden', 'true');
    document.body.prepend(world);
  }
  if (dest && cover) {
    stage.classList.add('has-dest');
    stage.append(under, leaf, place(dest, 0, 0));
  } else if (dest) {
    stage.classList.add('has-dest');
    // The chapter's name in the label above the book fades across too.
    const label = document.querySelector('.env-label span');
    const nextLabel = dest.querySelector('.env-label span');
    if (label && nextLabel && label.animate) {
      label.dataset.text = label.textContent;
      label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished
        .then(() => { label.textContent = nextLabel.textContent; label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' }); })
        .catch(() => {});
    }
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
  // Opening the cover goes on for a second step: the blank first page grows
  // to the size of the open book, the first chapter's world fades in behind
  // it, and then the chapter itself appears on the page.
  let grown = false;
  const growPage = () => {
    if (grown) return;
    grown = true;
    if (!dest.dataset.book || !under.animate) { finish(); return; }
    const [x, y, w, h] = JSON.parse(dest.dataset.book);
    const toTop = Math.max(y, 0);
    const to = { left: `${x}px`, top: `${toTop}px`, width: `${w}px`, height: `${Math.min(y + h, window.innerHeight) - toTop}px` };
    // Start from the whole open spread (the inside of the cover and the first
    // page), so the book never seems to shrink back to one page before growing.
    const pageWidth = parseFloat(under.style.width);
    const from = { left: `${parseFloat(under.style.left) - pageWidth}px`, top: under.style.top, width: `${pageWidth * 2}px`, height: under.style.height };
    const ease = 'cubic-bezier(.45, 0, .2, 1)';
    under.animate([from, to], { duration: 480, easing: ease, fill: 'forwards' });
    // Fade the inside of the cover itself (fading the whole 3D leaf would flatten it and snap).
    back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: 'ease-in-out', fill: 'forwards' });
    document.querySelectorAll('.turn-world').forEach((world) => world.classList.add('is-showing'));
    dest.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 400, easing: 'ease', fill: 'forwards' })
      .finished.then(finish, finish);
  };
  const opening = Boolean(cover && dest);
  leaf.addEventListener('animationend', (event) => {
    if (event.target !== leaf || !event.animationName.startsWith('leaf-')) return;
    if (opening) growPage(); else finish();
  });
  // Time everything from when the leaf actually starts moving: the first frame
  // of the turn can take a moment to draw, and the page must not be cleared or
  // left before it has turned.
  let started = false;
  leaf.addEventListener('animationstart', (event) => {
    // Only the leaf's own turn counts (its faces' animations bubble up here too).
    if (started || event.target !== leaf || !event.animationName.startsWith('leaf-')) return;
    started = true;
    // Belt and braces: once the page stands upright on the spine, remove its
    // content entirely so nothing can ever show through back to front.
    window.setTimeout(() => { front.style.visibility = 'hidden'; }, 345);
    window.setTimeout(finish, opening ? 1800 : 950);
    // The cover slows right down as it settles, so the page starts to grow
    // just before it lands rather than after a pause.
    if (opening) window.setTimeout(growPage, 560);
  });
  window.setTimeout(finish, 3000);

  // Keep the turn out of sight until the copied pictures are ready to draw, so
  // the first frame never shows a blank picture (the real page shows meanwhile).
  stage.style.opacity = '0';
  const pictures = [...front.querySelectorAll('img')].map((img) => (img.decode ? img.decode().catch(() => {}) : null));
  Promise.race([Promise.all(pictures), new Promise((resolve) => { window.setTimeout(resolve, 250); })]).then(() => {
    stage.style.opacity = '';
    startTurn();
  });
  const startTurn = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    // The leaf turns in two halves: the front shows until the page stands
    // upright on the spine, then only the blank back shows. This never relies
    // on backface-visibility, so the page can't show through onto the other side.
    stage.classList.toggle('is-backward', backward);
    stage.classList.add('is-turning');
    document.querySelectorAll('.turn-world:not(.is-waiting)').forEach((world) => world.classList.add('is-showing'));
  }));
}

// Going back to the cover closes the book: the reverse of opening it. The page
// clears to blank paper, shrinks to the size of the cover while the sea fades
// in around it, and then the cover swings shut over it.
function closeBook({ pages, go, dest }) {
  const rect = pages.getBoundingClientRect();
  const top = Math.max(rect.top, 0);
  const box = (el, [x, y, w, h]) => Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  const [cx, cy, cw, ch] = JSON.parse(dest.dataset.cover);

  const stage = document.createElement('div');
  stage.className = 'turn-stage is-cover is-closing has-dest';
  stage.setAttribute('aria-hidden', 'true');
  stage.style.perspectiveOrigin = `${cx}px 50%`;

  const world = document.createElement('div');
  world.className = `turn-world ${dest.dataset.page}`;
  world.setAttribute('aria-hidden', 'true');
  document.body.prepend(world);

  // the cover page around the book (tabs, label), without its cover for now
  Object.assign(dest.style, { left: '0px', top: '0px', opacity: '0' });
  dest.querySelector('.cover').style.visibility = 'hidden';

  const page = document.createElement('div');
  page.className = 'turn-under';
  box(page, [rect.left, top, rect.width, Math.min(rect.bottom, window.innerHeight) - top]);

  const leaf = document.createElement('div');
  leaf.className = 'turn-leaf';
  box(leaf, [cx, cy, cw, ch]);
  leaf.style.transformOrigin = 'left center';
  leaf.style.transform = 'rotateY(-180deg)';
  leaf.style.visibility = 'hidden';
  const front = document.createElement('div');
  front.className = 'turn-face turn-face--front';
  const board = dest.querySelector('.cover').cloneNode(true);
  board.classList.add('turn-clone');
  board.style.visibility = '';
  Object.assign(board.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', margin: '0' });
  front.appendChild(board);
  const back = document.createElement('div');
  back.className = 'turn-face turn-face--back';
  leaf.append(front, back);

  stage.append(dest, page, leaf);
  document.body.appendChild(stage);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('bj-page-turn', 'shown'); } catch (error) { /* ignore */ }
    go();
  };
  window.setTimeout(finish, 3000);
  const ease = 'cubic-bezier(.45, 0, .2, 1)';
  const fill = 'forwards';
  // 1. the page clears to blank paper
  page.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease', fill }).finished.then(() => {
    // 2. it shrinks to the size of the cover while the sea comes back around it
    world.classList.add('is-showing');
    dest.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease', fill });
    return page.animate([
      { left: page.style.left, top: page.style.top, width: page.style.width, height: page.style.height },
      { left: `${cx}px`, top: `${cy}px`, width: `${cw}px`, height: `${ch}px` },
    ], { duration: 480, easing: ease, fill }).finished;
  }).then(() => {
    // 3. the cover swings shut: its inside shows until it stands upright, then its front
    leaf.style.visibility = '';
    const turn = { duration: 700, fill };
    back.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], turn);
    front.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }], turn);
    return leaf.animate([
      { transform: 'rotateY(-180deg)', easing: 'cubic-bezier(.5, 0, .9, .55)' },
      { transform: 'rotateY(-90deg)', offset: 0.5, easing: 'cubic-bezier(.1, .45, .5, 1)' },
      { transform: 'rotateY(0deg)' },
    ], turn).finished;
  }).then(finish, finish);
}

// Coming back with the browser's Back button can restore a page mid-turn.
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  document.querySelectorAll('.turn-stage, .turn-world').forEach((el) => el.remove());
  document.documentElement.classList.remove('is-arriving', 'is-turned');
  document.querySelectorAll('.env-label span[data-text]').forEach((label) => {
    label.getAnimations().forEach((animation) => animation.cancel());
    label.textContent = label.dataset.text;
  });
  document.querySelectorAll('.cover-tabs, .cover-hint').forEach((el) => el.getAnimations().forEach((animation) => animation.cancel()));
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
// Any other chapter link: start fetching as soon as a finger or pointer lands on it.
['pointerdown', 'pointerover', 'focusin'].forEach((type) => document.addEventListener(type, (event) => {
  const link = event.target.closest && event.target.closest('a[href]');
  if (link && link.origin === window.location.origin && /\/$|\.html$/.test(link.pathname) && link.pathname !== window.location.pathname) fetchPage(link.href).catch(() => {});
}, { passive: true }));

// Offer a refresh when a newer version of the site has been published.
const updateCheck = document.createElement('script');
updateCheck.src = '/update.js';
updateCheck.defer = true;
document.head.appendChild(updateCheck);

// Installable web app: keep the book available offline.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((reg) => reg.update()).catch(() => {}); });
}

// Depth: with a mouse, the closed book leans toward the pointer and plates tilt
// under it. Nothing moves for touch, or when less motion is asked for.
(() => {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion');
  const book = document.querySelector('.cover-book');
  if (book) {
    let frame = 0;
    window.addEventListener('pointermove', (event) => {
      if (!fine.matches || calm() || turnPage.busy || event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = book.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
        const y = Math.max(-1, Math.min(1, (event.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
        book.classList.add('is-tilting');
        book.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
        book.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`);
        book.style.setProperty('--gx', `${(50 + x * 40).toFixed(1)}%`);
        book.style.setProperty('--gy', `${(40 + y * 40).toFixed(1)}%`);
      });
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
      book.classList.remove('is-tilting');
      book.style.setProperty('--rx', '0deg');
      book.style.setProperty('--ry', '0deg');
    });
  }
  document.querySelectorAll('.work-card .plate-frame img').forEach((img) => {
    img.addEventListener('pointermove', (event) => {
      if (!fine.matches || calm() || event.pointerType !== 'mouse') return;
      const r = img.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - 0.5;
      const y = (event.clientY - r.top) / r.height - 0.5;
      img.classList.add('is-tilting');
      img.style.setProperty('--py', `${(x * 12).toFixed(2)}deg`);
      img.style.setProperty('--px', `${(-y * 10).toFixed(2)}deg`);
    });
    img.addEventListener('pointerleave', () => { img.classList.remove('is-tilting'); });
  });
})();

// Web app: an "Install the book" button in the footer where the browser offers
// installing, and a "Share" button inside the installed app (which has no
// address bar to copy a link from). Footer buttons on the cover page too.
(() => {
  const standalone = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
  const footers = [...document.querySelectorAll('.footer-links')];
  const addButton = (label, onClick) => footers.map((links) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'footer-a11y footer-app';
    button.textContent = label;
    button.addEventListener('click', onClick);
    links.appendChild(button);
    return button;
  });

  if (!standalone) {
    let offer = null;
    let buttons = [];
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      offer = event;
      if (!buttons.length) {
        buttons = addButton('Install the book', () => {
          if (!offer) return;
          offer.prompt();
          offer.userChoice.finally(() => { offer = null; buttons.forEach((b) => b.remove()); buttons = []; });
        });
      }
    });
    window.addEventListener('appinstalled', () => { offer = null; buttons.forEach((b) => b.remove()); buttons = []; });
  }

  if (standalone && navigator.share) {
    addButton('Share this page', () => {
      navigator.share({ title: document.title, url: (document.querySelector('link[rel="canonical"]') || location).href }).catch(() => {});
    });
  }
})();
