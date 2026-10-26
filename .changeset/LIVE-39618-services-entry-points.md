---
"@features/flow-portfolio-services-entry-points": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

feat(portfolio): A/B test services entry points cards between Crypto and Stablecoins

`entryPointsServices` replaces the Perps and Borrow banners with a Services cards section on the LWD and LWM portfolio asset section. `params.services` sets which services show and their order. Flag state and order are reported to Mixpanel as `entryPointsServices`.
