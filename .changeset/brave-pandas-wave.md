---
"@shared/feature-flags": minor
"@ledgerhq/types-live": minor
"@ledgerhq/live-common": minor
"live-mobile": minor
---

Add `lwmProductTour` feature flag under `team-engagement` (off by default), persisted `productTourCompleted` in mobile settings, and a QA-focused Product Tour block under Settings → Debug → Wallet V4 features. [LIVE-28094](https://ledgerhq.atlassian.net/browse/LIVE-28094)

Mount the LWM Product Tour subtree on Portfolio when eligible, expose `openProductTour` / `closeProductTour`, handle `ledgerlive://product-tour`, and add tests. [LIVE-28122](https://ledgerhq.atlassian.net/browse/LIVE-28122)
