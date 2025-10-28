---
"ledger-live-desktop": minor
---

Prepare Desktop app for async account operations

Add `await` to `fromAccountRaw()` calls in account model and storage handlers. This is forward-compatible preparation - functions remain sync on develop, but we add `await` now to prepare for async migration.

