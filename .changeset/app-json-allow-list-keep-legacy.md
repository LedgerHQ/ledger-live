---
"ledger-live-desktop": minor
---

Add allow list and keepLegacy for app namespace: only allowed keyPaths are loaded and persisted; legacy "user" is kept until "identities" is written, then dropped at save time. Unknown keys are dropped on load and never written back.
