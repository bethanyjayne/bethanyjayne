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
- `404.html`: the missing-page spread, shown for any address that doesn't exist
- `cloudflare/_redirects`: sends old addresses (`/about.html`, `/childrens-books.html`, `/russel/` and so on) to the right chapter

Because pages sit in folders, every link and asset path starts with `/` (for example `/assets/...`, `/styles.css`), so the same paths work from any page and from the 404 page.

## Files

- `styles.css`: all styling; `site.js`: page turning, plate viewer, menus and the contact form; `page-turn.js`: runs first on each page
- `assets/art/`: illustrations as 640w and 1280w WebP, plus the cover and the social preview image
- `assets/characters/`: cut-out characters; `assets/backdrops/`: environment backgrounds made from the paintings

## Hosting

The site is hosted on Cloudflare Pages. Cloudflare builds every push to `main` with `bash cloudflare/build.sh` and publishes the `dist/` folder; other branches get their own preview address on `*.pages.dev`.

`cloudflare/build.sh` copies the site into `dist/`, adds `cloudflare/_headers` and `cloudflare/_redirects`, and stamps the build id into `update.js` and `version.json` (for the "website has been updated" popup). To try the build locally:

```sh
bash cloudflare/build.sh
npx wrangler pages dev dist
```

### Cloudflare Pages project settings

- Framework preset: None
- Build command: `bash cloudflare/build.sh`
- Build output directory: `dist`
- Production branch: `main`

## Local preview

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.
