---
"@ledgerhq/types-live": minor
"@features/platform-feature-flags": minor
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"ledger-live-desktop-e2e-tests": minor
---

Remove the `marketBanner` Wallet 4.0 param from desktop. The `/market` route now always renders the Market 4.0 experience, the legacy "Live compatible" market filter and dashboard market banner are dropped, and the `marketBanner` flag param/analytics attribute is now scoped to mobile (lwm) only.
