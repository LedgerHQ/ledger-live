---
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Fix content card displayedPosition analytics by stripping Braze string values in sanitizeExtras and finalizing numeric indices at the tracking gateway (mobile trackContentCardEvent, desktop trackContentCard) instead of at each call site.
