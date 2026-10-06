---
"ledger-live-desktop": patch
---

Move the desktop renderer's application database and device transport (HTTP proxy) access onto the preload bridge (`window.lld.db`, `window.lld.transport`), with one named method per operation.
