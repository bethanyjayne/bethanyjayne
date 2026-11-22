# Bethany Jayne: character portfolio

A static site for Bethany Jayne, children's book illustrator, presented as a picture book: the home page is the front cover, and each chapter is its own environment.

## Pages

- `index.html`: the front cover (lighthouse painting) with chapter tabs
- `about.html`: Chapter One, About (The Meadow)
- `otters.html`: Chapter Two, The Otters (The River)
- `pip.html`: Chapter Three, Pip (The Forest)
- `russel.html`: Chapter Four, Russel's Adventure (still being drawn)
- `contact.html`: Chapter Five, Contact (The Last Page)
- `childrens-books.html`: forwards old links to The Otters
- `404.html`: shown for any missing page

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
