document.documentElement.classList.add('js');
// Runs in <head>, before the first paint: if we arrived here by turning a
// page, start the new chapter on blank paper and let it fade in (see site.js).
(() => {
  try {
    const turn = sessionStorage.getItem('bj-page-turn');
    if (!turn) return;
    sessionStorage.removeItem('bj-page-turn');
    // 'shown': the page was already drawn under the turning leaf, so it appears at once.
    document.documentElement.classList.add(turn === 'shown' ? 'is-turned' : 'is-arriving');
  } catch (error) {
    // Storage can be unavailable (private mode); the page simply appears.
  }
})();
