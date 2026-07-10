---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Split monolithic wallet-api `react.ts` and `logic.ts` into granular per-handler/per-hook modules with ref-based handler registration. Internal refactor with no behavior change; consumers updated to direct module imports.
