# @features/platform-device-onboarding

## 0.3.0-next.0

### Minor Changes

- [#23704](https://github.com/LedgerHQ/ledger-live/pull/23704) [`d316d23`](https://github.com/LedgerHQ/ledger-live/commit/d316d23562d9fc50834d308bf978f548aa032c57) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Close any open app before reading the device state, so the onboarding no longer falls back to the legacy flow

- [#23604](https://github.com/LedgerHQ/ledger-live/pull/23604) [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d) Thanks [@sarneijim](https://github.com/sarneijim)! - Reset the device onboarding like a quit, and leave the genuine check screen even when quit comes before the device answered

- [#23699](https://github.com/LedgerHQ/ledger-live/pull/23699) [`c742800`](https://github.com/LedgerHQ/ledger-live/commit/c742800474dca6346e83690f414c31a747b0755f) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Offer Ledger Sync after the checks on a device that already has a seed, when the app passes offerSync

- [#23776](https://github.com/LedgerHQ/ledger-live/pull/23776) [`8d462cb`](https://github.com/LedgerHQ/ledger-live/commit/8d462cbfd64fec0e533396e7b7316a17550733bc) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the checks success screen up until the user continues

## 0.2.0

### Minor Changes

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23193](https://github.com/LedgerHQ/ledger-live/pull/23193) [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171) Thanks [@sarneijim](https://github.com/sarneijim)! - Run the genuine check again after a firmware update, with the early-check screen shown again

## 0.2.0-next.0

### Minor Changes

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23193](https://github.com/LedgerHQ/ledger-live/pull/23193) [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171) Thanks [@sarneijim](https://github.com/sarneijim)! - Run the genuine check again after a firmware update, with the early-check screen shown again
