---
"@shared/feature-flags": minor
"ledger-live-desktop": minor
---

feat(asset-detail): A/B test the swap console and a swap quick action on the LWD asset page

`lwdSwapConsoleAbtest` params `console` and `quickAction` toggle the swap right panel and a highlighted Swap CTA placed before Receive. Flag state and params are reported to Mixpanel as `lwdSwapConsoleAbtest`.
