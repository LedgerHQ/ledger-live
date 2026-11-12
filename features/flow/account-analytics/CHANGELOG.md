# @features/flow-account-analytics

## 0.2.0

### Minor Changes

- [#24556](https://github.com/LedgerHQ/ledger-live/pull/24556) [`e6c438d`](https://github.com/LedgerHQ/ledger-live/commit/e6c438d64ad0beb6224bd4c0361241641fe2a37d) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the native Account Analytics surface (filter chips opening a bottom sheet, status and Retry) and export AccountAnalytics from the package root for both apps.

- [#24554](https://github.com/LedgerHQ/ledger-live/pull/24554) [`e7a4d5a`](https://github.com/LedgerHQ/ledger-live/commit/e7a4d5a01ce2aa5636609f70cccc6274d5189b08) Thanks [@deepyjr](https://github.com/deepyjr)! - Share the Analytics balance, renderer status and PnL scope rules between the apps through the Account Analytics package.

- [#24553](https://github.com/LedgerHQ/ledger-live/pull/24553) [`ba1b7c4`](https://github.com/LedgerHQ/ledger-live/commit/ba1b7c45b4818bed008fcbed07d97b9a3e9aa0b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Share the Analytics catalog rules (eligible positions, asset grouping, catalog state) between the apps through the Account Analytics package.

- [#24311](https://github.com/LedgerHQ/ledger-live/pull/24311) [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand the fiat currency ticker as `FiatCurrencyTicker` (three uppercase letters) in `@domain/entity-currency-fiat` and use it for operation countervalues and the analytics fiat, replacing `CountervalueTicker` and the unused `FiatCurrencyId`.

- [#24255](https://github.com/LedgerHQ/ledger-live/pull/24255) [`81f924e`](https://github.com/LedgerHQ/ledger-live/commit/81f924e4acd4d79e898fa0cc8b1acf03a6c01de6) Thanks [@deepyjr](https://github.com/deepyjr)! - Integrate scoped Analytics filters, current balance and all-time PnL into desktop.

- [#24292](https://github.com/LedgerHQ/ledger-live/pull/24292) [`c6d8c4f`](https://github.com/LedgerHQ/ledger-live/commit/c6d8c4f1c50ada25f9c2bb4b5bbd50c117e3fce1) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the desktop Analytics catalog and scoped balance readers.

- [#24293](https://github.com/LedgerHQ/ledger-live/pull/24293) [`94961d4`](https://github.com/LedgerHQ/ledger-live/commit/94961d48d733bce0b50061f02c00f7942774fa70) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the shared Analytics web surface with asset/account filters and injected chart and PnL renderers.

- [#24234](https://github.com/LedgerHQ/ledger-live/pull/24234) [`aec9525`](https://github.com/LedgerHQ/ledger-live/commit/aec9525f565f851007d992a6c807efdf0958eb27) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Analytics selection rules and a context-aware request lifecycle with stable inline catalogs and explicit query-key helpers, keeping the PnL scope independent of the chart range.

- [#24462](https://github.com/LedgerHQ/ledger-live/pull/24462) [`73bd4ee`](https://github.com/LedgerHQ/ledger-live/commit/73bd4ee5567f188c79b70a3f2bd2507e81d2ba85) Thanks [@deepyjr](https://github.com/deepyjr)! - Track the Analytics filters, the Analytics banner click and its visibility on the account page.

### Patch Changes

- Updated dependencies [[`711b543`](https://github.com/LedgerHQ/ledger-live/commit/711b543456a56c18f5aa0828de974a2ee9b94c6b), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead), [`55a43bc`](https://github.com/LedgerHQ/ledger-live/commit/55a43bcb1d736466d956eb8645d9e310e3daaaab), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`b67184a`](https://github.com/LedgerHQ/ledger-live/commit/b67184adc0aa9a2e0871a8a636fa8bdcee846877), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @features/platform-aggregated-assets@0.7.0
  - @domain/entity-currency-fiat@0.6.0
  - @domain/entity-aggregated-asset@0.4.0
  - @domain/api-aggregated-assets@0.7.0
  - @domain/entity-currency@0.5.0
  - @domain/entity-market-countervalues@0.5.0

## 0.2.0-next.0

### Minor Changes

- [#24556](https://github.com/LedgerHQ/ledger-live/pull/24556) [`e6c438d`](https://github.com/LedgerHQ/ledger-live/commit/e6c438d64ad0beb6224bd4c0361241641fe2a37d) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the native Account Analytics surface (filter chips opening a bottom sheet, status and Retry) and export AccountAnalytics from the package root for both apps.

- [#24554](https://github.com/LedgerHQ/ledger-live/pull/24554) [`e7a4d5a`](https://github.com/LedgerHQ/ledger-live/commit/e7a4d5a01ce2aa5636609f70cccc6274d5189b08) Thanks [@deepyjr](https://github.com/deepyjr)! - Share the Analytics balance, renderer status and PnL scope rules between the apps through the Account Analytics package.

- [#24553](https://github.com/LedgerHQ/ledger-live/pull/24553) [`ba1b7c4`](https://github.com/LedgerHQ/ledger-live/commit/ba1b7c45b4818bed008fcbed07d97b9a3e9aa0b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Share the Analytics catalog rules (eligible positions, asset grouping, catalog state) between the apps through the Account Analytics package.

- [#24311](https://github.com/LedgerHQ/ledger-live/pull/24311) [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand the fiat currency ticker as `FiatCurrencyTicker` (three uppercase letters) in `@domain/entity-currency-fiat` and use it for operation countervalues and the analytics fiat, replacing `CountervalueTicker` and the unused `FiatCurrencyId`.

- [#24255](https://github.com/LedgerHQ/ledger-live/pull/24255) [`81f924e`](https://github.com/LedgerHQ/ledger-live/commit/81f924e4acd4d79e898fa0cc8b1acf03a6c01de6) Thanks [@deepyjr](https://github.com/deepyjr)! - Integrate scoped Analytics filters, current balance and all-time PnL into desktop.

- [#24292](https://github.com/LedgerHQ/ledger-live/pull/24292) [`c6d8c4f`](https://github.com/LedgerHQ/ledger-live/commit/c6d8c4f1c50ada25f9c2bb4b5bbd50c117e3fce1) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the desktop Analytics catalog and scoped balance readers.

- [#24293](https://github.com/LedgerHQ/ledger-live/pull/24293) [`94961d4`](https://github.com/LedgerHQ/ledger-live/commit/94961d48d733bce0b50061f02c00f7942774fa70) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the shared Analytics web surface with asset/account filters and injected chart and PnL renderers.

- [#24234](https://github.com/LedgerHQ/ledger-live/pull/24234) [`aec9525`](https://github.com/LedgerHQ/ledger-live/commit/aec9525f565f851007d992a6c807efdf0958eb27) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Analytics selection rules and a context-aware request lifecycle with stable inline catalogs and explicit query-key helpers, keeping the PnL scope independent of the chart range.

- [#24462](https://github.com/LedgerHQ/ledger-live/pull/24462) [`73bd4ee`](https://github.com/LedgerHQ/ledger-live/commit/73bd4ee5567f188c79b70a3f2bd2507e81d2ba85) Thanks [@deepyjr](https://github.com/deepyjr)! - Track the Analytics filters, the Analytics banner click and its visibility on the account page.

### Patch Changes

- Updated dependencies [[`711b543`](https://github.com/LedgerHQ/ledger-live/commit/711b543456a56c18f5aa0828de974a2ee9b94c6b), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead), [`55a43bc`](https://github.com/LedgerHQ/ledger-live/commit/55a43bcb1d736466d956eb8645d9e310e3daaaab), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`b67184a`](https://github.com/LedgerHQ/ledger-live/commit/b67184adc0aa9a2e0871a8a636fa8bdcee846877), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @features/platform-aggregated-assets@0.7.0-next.0
  - @domain/entity-currency-fiat@0.6.0-next.0
  - @domain/entity-aggregated-asset@0.4.0-next.0
  - @domain/api-aggregated-assets@0.7.0-next.0
  - @domain/entity-currency@0.5.0-next.0
  - @domain/entity-market-countervalues@0.5.0-next.0
