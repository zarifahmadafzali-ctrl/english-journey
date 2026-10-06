# OTA web bundles

These files update **only** the React/JS/CSS layer inside an already-installed APK.

Native code and offline TTS models are **not** re-downloaded.

- `manifest.json` — channel → version + zip URL
- `bundles/<version>.zip` — contents of Vite `dist/`

Channels: `production` (default), `beta` (debugging).
