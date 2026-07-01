---
"@ledgerhq/live-common": patch
"live-mobile": patch
"ledger-live-desktop": patch
---

Fix content card displayedPosition analytics by stripping Braze string values in sanitizeExtras and finalizing numeric indices at the tracking gateway (mobile trackContentCardEvent, desktop trackContentCard) instead of at each call site.
