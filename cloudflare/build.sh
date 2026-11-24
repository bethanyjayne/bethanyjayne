#!/usr/bin/env bash
# Builds the site for Cloudflare Pages into dist/.
#
# Cloudflare Pages settings: build command `bash cloudflare/build.sh`,
# build output directory `dist`. No framework preset, no install step.
#
# What it does:
#   1. Copies the site (tracked files only) into dist/, leaving out
#      repository-only files and the old forwarding pages, which become
#      proper 301 redirects in cloudflare/_redirects instead.
#   2. Adds _headers and _redirects.
#   3. Stamps the build id into update.js and writes version.json, so open
#      pages offer the "website has been updated" refresh (see update.js).
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=dist
rm -rf "$OUT"
mkdir -p "$OUT"

# Paths that are not part of the published site.
SKIP='^(\.github/|cloudflare/|dist/|README\.md$|\.gitignore$|russel/|(about|contact|otters|pip|russel|russell|childrens-books)\.html$)'

git ls-files -z | grep -zvE "$SKIP" | tar --null -T - -cf - | tar -xf - -C "$OUT"
cp cloudflare/_headers cloudflare/_redirects "$OUT/"

SHA="${CF_PAGES_COMMIT_SHA:-${GITHUB_SHA:-$(git rev-parse HEAD)}}"
BUILD="${SHA::12}-$(date -u +%Y%m%d%H%M%S)"
printf '{"version":"%s"}\n' "$BUILD" > "$OUT/version.json"
sed -i "s/__SITE_BUILD__/$BUILD/" "$OUT/update.js"
grep -q "$BUILD" "$OUT/update.js"

echo "Built $(find "$OUT" -type f | wc -l) files into $OUT/ (build $BUILD)"
