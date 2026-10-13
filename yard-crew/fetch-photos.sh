#!/bin/sh
# Vercel build step for the Leaves Away site.
#
# Copies the site into dist/ and downloads the photos it uses from Unsplash
# (free to use under the Unsplash License, https://unsplash.com/license).
# If a download fails or returns something that isn't a real photo, the build
# fails, so the live site never goes out with a missing picture.
#
# To swap a photo: find it on unsplash.com, copy the ID at the end of its
# page URL (unsplash.com/photos/some-title-<ID>) and replace the ID below.
set -eu

rm -rf dist
mkdir -p dist/img
cp index.html styles.css config.js app.js dist/

# Exit codes say which photo failed, because Vercel shows the exit code even
# when the build log isn't handy: 10 x photo number + 1 (HTTP 401), 3 (403),
# 4 (404), 9 (other 4xx), 5 (5xx), 0 (no response) or 7 (file too small).
photo_number=0
fetch_photo() {
  name=$1
  id=$2
  width=$3
  photo_number=$((photo_number + 1))
  out="dist/img/$name.jpg"
  status=$(curl -sSL --retry 3 --max-time 60 -o "$out" -w '%{http_code}' \
    -A "Mozilla/5.0 (compatible; LeavesAwaySiteBuild/1.0)" \
    "https://unsplash.com/photos/$id/download?force=true&w=$width" || echo 000)
  case "$status" in
    2??) ;;
    401) echo "Photo '$name' ($id): HTTP 401" >&2; exit $((photo_number * 10 + 1)) ;;
    403) echo "Photo '$name' ($id): HTTP 403" >&2; exit $((photo_number * 10 + 3)) ;;
    404) echo "Photo '$name' ($id): HTTP 404" >&2; exit $((photo_number * 10 + 4)) ;;
    4??) echo "Photo '$name' ($id): HTTP $status" >&2; exit $((photo_number * 10 + 9)) ;;
    5??) echo "Photo '$name' ($id): HTTP $status" >&2; exit $((photo_number * 10 + 5)) ;;
    *) echo "Photo '$name' ($id): no response" >&2; exit $((photo_number * 10)) ;;
  esac
  size=$(wc -c < "$out")
  if [ "$size" -lt 20000 ]; then
    echo "Photo '$name' ($id) is only $size bytes, so it probably isn't an image." >&2
    exit $((photo_number * 10 + 7))
  fi
  echo "Downloaded $name.jpg ($size bytes)"
}

fetch_photo rake      xsAj4IwTYik 2200  # Red rake on a pile of leaves, by Wendell Shinn
fetch_photo raking    X1TtfBUkh3U 900   # Man holding a garden rake, by Luiz Guimaraes
fetch_photo leaf-pile REto6jrhWyQ 2000  # Pile of fallen autumn leaves, by Maximilian Zahn
fetch_photo mower     8vBpYpTGo90 1800  # Lawn mower on green grass, by Daniel Watson
fetch_photo snow      TDiWmXb9-qk 1800  # Person shoveling snow, by Filip Mroz
