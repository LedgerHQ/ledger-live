---
"@ledgerhq/live-network": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"ledger-live-mobile": minor
---

fix(hypercore): tell the user Hyperliquid is unavailable in their region instead of showing a balance error

Adding or syncing a Hyperliquid account from a restricted region failed with "Your balance could not
be retrieved". Ledger's compliance layer answers every route of a blocked backend with a redirect to
compliance.ledger.com, which `@ledgerhq/live-network` now recognises: it throws `RegionRestricted`,
which the generic coin framework names `CurrencyRegionRestrictedError` so the apps can tell the user
which currency is unavailable, and offer the compliance article.
