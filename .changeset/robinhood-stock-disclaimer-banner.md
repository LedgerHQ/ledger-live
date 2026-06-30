---
"live-mobile": minor
"@shared/feature-flags": patch
---

Add an informational disclaimer banner on the Wallet 4.0 asset detail screen for assets supported exclusively on a Robinhood chain (e.g. tokenized stocks on robinhood_testnet). The banner is gated by the `llRobinhoodDisclaimer` feature flag, which is simplified to a plain boolean flag (its unused `url` param is removed).
