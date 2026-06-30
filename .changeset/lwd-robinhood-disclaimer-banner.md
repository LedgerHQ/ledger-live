---
"ledger-live-desktop": minor
"@ledgerhq/asset-detail": patch
---

Add an informational disclaimer banner on the Wallet 4.0 asset detail screen for assets supported exclusively on a Robinhood chain (e.g. tokenized stocks on robinhood_testnet) when the user holds a positive balance. The banner is gated by the `llRobinhoodDisclaimer` feature flag. Adds the shared `isRobinhoodExclusiveAsset` helper to `@ledgerhq/asset-detail`. Implements LIVE-32756.
