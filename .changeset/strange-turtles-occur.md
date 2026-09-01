---
"ledger-live-desktop": minor
---

Fix Market Banner crash when a price-change percentage is missing. The desktop trending tile now uses `getChangePercentage` like mobile, which treats null or undefined values as 0 instead of calling `.toFixed` on them.
