#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/public/assets/hands"

mkdir -p "$OUT_DIR"

jq -r '.items[] | [.id, .hand.imageUrl] | @tsv' "$ROOT/data/qa.json" |
  while IFS=$'\t' read -r id url; do
    printf -v file "$OUT_DIR/q%02d.png" "$id"
    curl -fL --compressed -sS \
      -A 'Mozilla/5.0' \
      -e 'https://www.bilibili.com/' \
      "$url" \
      -o "$file"
  done

echo "Downloaded $(find "$OUT_DIR" -type f -name 'q*.png' | wc -l | tr -d ' ') images to public/assets/hands."
