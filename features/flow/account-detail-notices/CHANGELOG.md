# @features/flow-account-detail-notices

## 0.3.0-next.0

### Minor Changes

- [#23982](https://github.com/LedgerHQ/ledger-live/pull/23982) [`5be64be`](https://github.com/LedgerHQ/ledger-live/commit/5be64be2b44e1ad7358a2b6db2ab56108ef73fd0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail on LWD shows the account notices (currency migration, deprecation and custom banners, Robinhood disclaimer, Perps) and the family blocks (pending transfer proposals, sub header, balance summary footer, body header) in the custom place. The notices package now maps the remote currency config into notice signals (`toCurrencyStatusSignal`, `toCustomBannerSignal`).

## 0.2.0

### Minor Changes

- [#23936](https://github.com/LedgerHQ/ledger-live/pull/23936) [`8ecfdc4`](https://github.com/LedgerHQ/ledger-live/commit/8ecfdc43164fe229209aac15f54a098063024c7a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - New `@features/flow-account-detail-notices` package: the notices shown on the Account Detail page above the family blocks (currency migration and upcoming deprecation, remote custom banner, Robinhood chain disclaimer, Perps). `resolveAccountNotices` turns plain signals from each app into the notices to show, in a fixed order; `AccountNotices` and `AccountStatusBanner` render them as Lumen info banners with package-owned copy (added to both English catalogs). The features-flow web Lumen test stub now renders `Banner` actions, like the native one.

### Patch Changes

- Updated dependencies []:
  - @shared/i18n@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#23936](https://github.com/LedgerHQ/ledger-live/pull/23936) [`8ecfdc4`](https://github.com/LedgerHQ/ledger-live/commit/8ecfdc43164fe229209aac15f54a098063024c7a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - New `@features/flow-account-detail-notices` package: the notices shown on the Account Detail page above the family blocks (currency migration and upcoming deprecation, remote custom banner, Robinhood chain disclaimer, Perps). `resolveAccountNotices` turns plain signals from each app into the notices to show, in a fixed order; `AccountNotices` and `AccountStatusBanner` render them as Lumen info banners with package-owned copy (added to both English catalogs). The features-flow web Lumen test stub now renders `Banner` actions, like the native one.

### Patch Changes

- Updated dependencies []:
  - @shared/i18n@0.2.0
