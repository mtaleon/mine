#!/bin/bash
# Build OTA bundle for Mine Android WebView updates.
# Zips web assets, computes SHA-256 hash, updates version.json.
set -e

cd "$(dirname "$0")/.."

if [ ! -f "version.json" ]; then
  echo "ERROR: version.json not found" >&2; exit 1
fi

VERSION=$(python3 -c "import json; d=json.load(open('version.json')); print(d.get('otaVersionCode', 1))")
OUT="ota/bundle-v${VERSION}.zip"

mkdir -p ota

echo "[OTA] Building Mine bundle v${VERSION}..."

# Core files needed for Mine
OTA_FILES="
  index.html
  app.js
  config.json
  version.json
  manifest.json
  favicon.svg
  sw.js
  core/constants.js
  core/events.js
  core/game.js
  core/board.js
  core/cell.js
  core/i18n.js
  core/api.js
  core/uuid.js
  core/ota.js
  core/health.js
  platform/platform.js
  platform/IRenderer.js
  platform/IInput.js
  platform/IAudio.js
  platforms/web-dom/renderer.js
  platforms/web-dom/input.js
  platforms/web-dom/audio.js
  platforms/web-dom/styles.css
"

# Verify critical files exist
for f in index.html app.js config.json; do
  if [ ! -f "$f" ]; then
    echo "ERROR: $f missing" >&2; exit 1
  fi
done

# Generate ota_manifest.json with per-file SHA-256 hashes
echo "[OTA] Generating ota_manifest.json..."
echo '{"files":{' > ota_manifest.json
FIRST=1
for f in $OTA_FILES; do
    if [ ! -f "$f" ]; then
        echo "WARNING: $f not found, skipping" >&2
        continue
    fi
    FHASH=$(shasum -a 256 "$f" | cut -d' ' -f1)
    if [ $FIRST -eq 1 ]; then FIRST=0; else echo ',' >> ota_manifest.json; fi
    printf '"%s":"sha256:%s"' "$f" "$FHASH" >> ota_manifest.json
done
echo '}}' >> ota_manifest.json

# Create bundle (preserve directory structure)
echo "[OTA] Packaging bundle..."
zip -r "$OUT" $OTA_FILES ota_manifest.json

rm -f ota_manifest.json

HASH=$(shasum -a 256 "$OUT" | cut -d' ' -f1)
SIZE=$(wc -c < "$OUT" | tr -d ' ')

# Update version.json
python3 -c "
import json
with open('version.json') as f:
    data = json.load(f)
data['bundleUrl'] = 'https://mine.octile.eu.cc/${OUT}'
data['bundleHash'] = 'sha256:${HASH}'
with open('version.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write('\n')
"

echo "[OTA] Bundle: $OUT ($SIZE bytes)"
echo "[OTA] SHA-256: $HASH"
echo "[OTA] version.json updated"
echo "[OTA] Done! Commit version.json and upload $OUT to hosting."
