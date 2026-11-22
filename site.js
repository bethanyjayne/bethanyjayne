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
  if (link) window.location.href = link.href;
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
