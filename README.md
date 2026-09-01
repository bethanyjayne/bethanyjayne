# Bethany Jayne site library

This folder contains the downloaded Wix page snapshots and their shared local assets.

## Layout

- `index.html` is the home page snapshot and GitHub Pages entrypoint.
- `about.html` is the about page snapshot.
- `childrens-books.html` is the children's books page snapshot.
- `contact.html` is the contact page snapshot.
- `assets/` contains the JavaScript bundles and downloaded image media used by every page.

The pages use a small shared CSS and JavaScript layer and reference `./assets/` for the original artwork. The site works as a static GitHub Pages site with no build step.

## Local preview

Serve this folder from a local HTTP server so browser module loading and asset paths behave consistently. For example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.