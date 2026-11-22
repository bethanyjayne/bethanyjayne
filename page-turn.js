// Turn the page the right way: forwards through the book, or back.
// Runs in <head> so it can label the page transition before the first paint.
(() => {
  const order = ['index.html', 'about.html', 'childrens-books.html', 'contact.html'];
  const position = (url) => order.indexOf(new URL(url, location.href).pathname.split('/').pop() || 'index.html');

  window.addEventListener('pagereveal', (event) => {
    const activation = window.navigation && navigation.activation;
    if (!event.viewTransition || !activation || !activation.from) return;
    const from = position(activation.from.url);
    const to = position(activation.entry.url);
    if (from < 0 || to < 0 || from === to) return;
    event.viewTransition.types.add(to < from ? 'backward' : 'forward');
  });
})();
