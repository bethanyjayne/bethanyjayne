// Runs in <head>, before the first paint: if we arrived here by turning a
// page, start the new chapter on blank paper and let it fade in (see site.js).
(() => {
  try {
    const turn = sessionStorage.getItem('bj-page-turn');
    if (!turn) return;
    sessionStorage.removeItem('bj-page-turn');
    document.documentElement.classList.add('is-arriving');
  } catch (error) {
    // Storage can be unavailable (private mode); the page simply appears.
  }
})();
