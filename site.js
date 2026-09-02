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