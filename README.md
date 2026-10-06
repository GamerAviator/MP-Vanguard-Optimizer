# Mighty Party Vanguard Optimizer

A mobile-first, installable PWA for planning Vanguard upgrades.

## Features

- Multiple player accounts stored locally on each device
- Fixed-order roster screenshot import with review before applying
- Resource bar screenshot import
- Fast Max Might and faction-focused Balanced Account plans
- Guild Boost and All In One Guild Spoils comparisons
- Backup export and restore

Max Might is a fast best-found plan, not a guaranteed global optimum. Balanced targets are Common 400, Rare 600, Epic 800, Legendary 1000, Mythic 1200. Lower rarities stop at their targets; after all owned cards reach their targets, only Mythics advance.

## Publish on GitHub Pages

Upload all files in this folder to the repository root (index.html must be at the top level).
Then choose Settings → Pages → Deploy from a branch → main → /(root) → Save.

Expected URL after publication:
https://gameraviator.github.io/MP-Vanguard-Optimizer/

## Privacy and backups

No personal player data is bundled with this app. Levels, resources and account names are stored in the user's own browser. Clearing site data can erase them. Export a backup regularly. A new website address has separate storage: export from the old app and restore on this app to transfer accounts.

Screenshot OCR downloads Tesseract on first use and requires internet access then. Images are processed locally. Offline functionality is available after the app assets have been cached.

## Development

Static HTML/CSS/JavaScript modules; no build or paid server required. Serve this folder using a local web server rather than opening index.html directly. The optimizer engine is engine.js, independent from the UI. The UI worker uses fastMaxMight; exhaustive maxMight is retained for verification, not the interactive path.

Unofficial community tool; not affiliated with Mighty Party. Offer values are a snapshot and may change. Verify imported levels and balances before using a plan.
