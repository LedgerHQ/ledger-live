---
"ledger-live-desktop": patch
---

Fix crash when leaving a live app with DevTools open on Electron 42 by guarding the auto-close against an already-destroyed DevTools WebContents
