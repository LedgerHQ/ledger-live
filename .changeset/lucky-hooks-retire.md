---
"ledger-live-desktop": minor
"live-mobile": minor
---

Replace the useTrack hook with the module-level track function

Internal refactor ahead of the analytics package migration. Every event keeps the properties it emits today: desktop reads the `drawer` name from the drawer context (or passes the custom-lock-screen constant directly) at each call site, and mobile's swap entry point rebuilds its router-derived `page` with `usePageNameFromRoute`.
