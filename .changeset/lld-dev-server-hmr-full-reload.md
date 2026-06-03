---
"ledger-live-desktop": patch
---

fix(dev): stop the renderer dev server full-reloading on every source edit

The dev server watched `src/renderer` as a static directory, so any source change triggered a full-page `liveReload` that pre-empted React Fast Refresh. Disabling `static.watch` lets HMR apply component updates in place.
