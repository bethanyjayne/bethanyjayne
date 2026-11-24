# Bethany Jayne: character portfolio

A static site for Bethany Jayne, children's book illustrator, presented as a picture book: the home page is the front cover, and each chapter is its own environment.

## Pages

Each chapter lives in its own folder, so addresses are clean (`/otters/` rather than `/otters.html`):

- `index.html`: the front cover (lighthouse painting) with chapter tabs, at `/`
- `about/index.html`: Chapter One, About (The Meadow), at `/about/`
- `otters/index.html`: Chapter Two, The Otters (The River), at `/otters/`
- `pip/index.html`: Chapter Three, Pip (The Forest), at `/pip/`
- `russell/index.html`: Chapter Four, Russell's Adventure (cover, flip-through video and exhibition photo), at `/russell/`
- `contact/index.html`: Chapter Five, Contact (The Last Page), at `/contact/`
- `404.html`: the missing-page spread, shown by GitHub Pages for any address that doesn't exist
- `about.html`, `otters.html`, `pip.html`, `russell.html`, `contact.html`, `childrens-books.html`: tiny forwarding pages so old links and bookmarks still land on the right chapter

Because pages sit in folders, every link and asset path starts with `/` (for example `/assets/...`, `/styles.css`), so the same paths work from any page and from the 404 page.

## Files

- `styles.css`: all styling; `site.js`: page turning, plate viewer, menus and the contact form; `page-turn.js`: runs first on each page
- `assets/art/`: illustrations as 640w and 1280w WebP, plus the cover and the social preview image
- `assets/characters/`: cut-out characters; `assets/backdrops/`: environment backgrounds made from the paintings

The site needs no build step and is deployed to GitHub Pages by `.github/workflows/static.yml`.

## Local preview

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.
