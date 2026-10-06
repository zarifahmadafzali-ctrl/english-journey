#!/usr/bin/env bash
# Build dist zip for OTA and refresh public/ota/manifest.json
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VERSION=$(node -p "require('./package.json').version")
CHANNEL_NOTES="${1:-Web bundle update}"
BASE_URL="${OTA_BASE_URL:-https://zarifahmadafzali-ctrl.github.io/english-journey}"

npm run build

mkdir -p public/ota/bundles
ZIP="public/ota/bundles/${VERSION}.zip"
rm -f "$ZIP"
( cd dist && zip -r -q "../${ZIP}" . )
SIZE=$(wc -c < "$ZIP" | tr -d ' ')

export VERSION BASE_URL CHANNEL_NOTES
node << 'NODE'
const fs = require('fs');
const version = process.env.VERSION;
const base = process.env.BASE_URL;
const notes = process.env.CHANNEL_NOTES;
const url = `${base}/ota/bundles/${version}.zip`;
const manifest = {
  appId: 'com.englishjourney.app',
  updatedAt: new Date().toISOString(),
  channels: {
    production: { version, url, notes },
    beta: { version, url, notes: notes + ' (beta)' }
  }
};
fs.mkdirSync('public/ota', { recursive: true });
fs.writeFileSync('public/ota/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('OTA package version', version, 'url', url);
NODE

mkdir -p dist/ota/bundles
cp public/ota/manifest.json dist/ota/manifest.json
cp "$ZIP" "dist/ota/bundles/${VERSION}.zip"
cp public/ota/README.md dist/ota/README.md 2>/dev/null || true
echo "Bundle size bytes: $SIZE"
