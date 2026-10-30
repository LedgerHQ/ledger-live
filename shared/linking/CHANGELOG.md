# @shared/linking

## 0.4.0-next.0

### Minor Changes

- [#23713](https://github.com/LedgerHQ/ledger-live/pull/23713) [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account settings (LWM bottom sheet, LWD dialog) show a **View in explorer** entry under Advanced logs that opens the account's address in the currency's block explorer, hidden when the currency has none. The package builds the URL from the account's currency and address with `@domain/entity-currency-crypto` and opens it through `@shared/linking` as a sensitive link: `openLink(url, { sensitive: true })` still opens the full URL but only reports its origin to `onLinkOpened`, so the address never reaches analytics; `getDefaultExplorerView` accepts any object carrying `explorerViews`.

- [#23902](https://github.com/LedgerHQ/ledger-live/pull/23902) [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa) Thanks [@LL782](https://github.com/LL782)! - Improve link and deeplink tracking

## 0.3.0

### Minor Changes

- [#22056](https://github.com/LedgerHQ/ledger-live/pull/22056) [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/linking package for cross-platform external link handling with URL safety, localization and analytics

## 0.3.0-next.0

### Minor Changes

- [#22056](https://github.com/LedgerHQ/ledger-live/pull/22056) [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/linking package for cross-platform external link handling with URL safety, localization and analytics

## 0.2.0

### Minor Changes

- [#21825](https://github.com/LedgerHQ/ledger-live/pull/21825) [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/platform-linking package for cross-platform external link handling with URL safety, localization and analytics

## 0.2.0-next.0

### Minor Changes

- [#21825](https://github.com/LedgerHQ/ledger-live/pull/21825) [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/platform-linking package for cross-platform external link handling with URL safety, localization and analytics
