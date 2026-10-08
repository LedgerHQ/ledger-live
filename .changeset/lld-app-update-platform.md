---
"ledger-live-desktop": patch
---

Move the updater signature check to `@features/platform-app-update`, so desktop no longer depends on `@noble/curves` directly.
