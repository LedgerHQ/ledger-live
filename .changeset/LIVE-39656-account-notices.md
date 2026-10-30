---
"@features/flow-account-detail-notices": minor
"@support/jest": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

New `@features/flow-account-detail-notices` package: the notices shown on the Account Detail page above the family blocks (currency migration and upcoming deprecation, remote custom banner, Robinhood chain disclaimer, Perps). `resolveAccountNotices` turns plain signals from each app into the notices to show, in a fixed order; `AccountNotices` and `AccountStatusBanner` render them as Lumen info banners with package-owned copy (added to both English catalogs). The features-flow web Lumen test stub now renders `Banner` actions, like the native one.
