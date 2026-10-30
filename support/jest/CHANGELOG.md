# @support/jest

## 0.2.0-next.0

### Minor Changes

- [#23936](https://github.com/LedgerHQ/ledger-live/pull/23936) [`8ecfdc4`](https://github.com/LedgerHQ/ledger-live/commit/8ecfdc43164fe229209aac15f54a098063024c7a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - New `@features/flow-account-detail-notices` package: the notices shown on the Account Detail page above the family blocks (currency migration and upcoming deprecation, remote custom banner, Robinhood chain disclaimer, Perps). `resolveAccountNotices` turns plain signals from each app into the notices to show, in a fixed order; `AccountNotices` and `AccountStatusBanner` render them as Lumen info banners with package-owned copy (added to both English catalogs). The features-flow web Lumen test stub now renders `Banner` actions, like the native one.
