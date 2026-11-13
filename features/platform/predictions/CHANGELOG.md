# @features/platform-predictions

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`91056c1`](https://github.com/LedgerHQ/ledger-live/commit/91056c17c325bf042f6449c3ed74412adcb84899)]:
  - @features/platform-device-intent@5.5.0-next.0

## 0.4.0

### Minor Changes

- [#24449](https://github.com/LedgerHQ/ledger-live/pull/24449) [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.bindAccount` and `custom.predictions.reportSetup`: Ledger Wallet asks the user to confirm on their device that they own the account picked in Predictions, then shows the trading wallet setup the live app reports. `AnimatedHeight` now counts SVG children, like a loading spinner, so the dialog no longer clips its bottom

- [#24149](https://github.com/LedgerHQ/ledger-live/pull/24149) [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a Predictions card to the portfolio services entry points and a Predictions screen that opens the live app, behind the `ptxPredictionsLiveAppDesktop` and `ptxPredictionsLiveAppMobile` flags

- [#23551](https://github.com/LedgerHQ/ledger-live/pull/23551) [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions onboarding sheet behind the custom.predictions.onboard and custom.predictions.close Wallet API methods

### Patch Changes

- Updated dependencies [[`235a1ae`](https://github.com/LedgerHQ/ledger-live/commit/235a1ae2d5de213ab2f59a2aa584ef59e2058372)]:
  - @features/platform-device-intent@5.4.0

## 0.4.0-next.0

### Minor Changes

- [#24449](https://github.com/LedgerHQ/ledger-live/pull/24449) [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.bindAccount` and `custom.predictions.reportSetup`: Ledger Wallet asks the user to confirm on their device that they own the account picked in Predictions, then shows the trading wallet setup the live app reports. `AnimatedHeight` now counts SVG children, like a loading spinner, so the dialog no longer clips its bottom

- [#24149](https://github.com/LedgerHQ/ledger-live/pull/24149) [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a Predictions card to the portfolio services entry points and a Predictions screen that opens the live app, behind the `ptxPredictionsLiveAppDesktop` and `ptxPredictionsLiveAppMobile` flags

- [#23551](https://github.com/LedgerHQ/ledger-live/pull/23551) [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions onboarding sheet behind the custom.predictions.onboard and custom.predictions.close Wallet API methods

### Patch Changes

- Updated dependencies [[`235a1ae`](https://github.com/LedgerHQ/ledger-live/commit/235a1ae2d5de213ab2f59a2aa584ef59e2058372)]:
  - @features/platform-device-intent@5.4.0-next.0

## 0.3.0

### Minor Changes

- [#24013](https://github.com/LedgerHQ/ledger-live/pull/24013) [`8aad423`](https://github.com/LedgerHQ/ledger-live/commit/8aad4236ec8f65d1d5026d54ae761ba51efe863c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the ledgerlive://predictions deep link, which opens the Predictions live app with the link's query params. On mobile, https universal links (ledger.go.link) now go through the same deep link handling as ledgerlive:// links

## 0.3.0-next.0

### Minor Changes

- [#24013](https://github.com/LedgerHQ/ledger-live/pull/24013) [`8aad423`](https://github.com/LedgerHQ/ledger-live/commit/8aad4236ec8f65d1d5026d54ae761ba51efe863c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the ledgerlive://predictions deep link, which opens the Predictions live app with the link's query params. On mobile, https universal links (ledger.go.link) now go through the same deep link handling as ledgerlive:// links

## 0.2.0

### Minor Changes

- [#23769](https://github.com/LedgerHQ/ledger-live/pull/23769) [`d741fe9`](https://github.com/LedgerHQ/ledger-live/commit/d741fe90123f200bf9ea579eae899153fe70f848) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the custom.predictions.onboard and custom.predictions.close Wallet API handlers, and the Predictions intro flag

## 0.2.0-next.0

### Minor Changes

- [#23769](https://github.com/LedgerHQ/ledger-live/pull/23769) [`d741fe9`](https://github.com/LedgerHQ/ledger-live/commit/d741fe90123f200bf9ea579eae899153fe70f848) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the custom.predictions.onboard and custom.predictions.close Wallet API handlers, and the Predictions intro flag
