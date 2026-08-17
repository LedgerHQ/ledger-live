---
"@shared/feature-flags": minor
"@features/flow-large-screen-upsell": major
"ledger-live-desktop": minor
---

Add a My Wallet Profile LNS upsell banner gated by `largeScreenUpsell.banners.profile` (LIVE-35481). Require `utmContent` on `buildLargeScreenUpsellCtaLink` and export `LARGE_SCREEN_UPSELL_UTM`.
