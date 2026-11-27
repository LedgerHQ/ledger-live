# @features/platform-predictions

## 0.5.0-next.0

### Minor Changes

- [#25596](https://github.com/LedgerHQ/ledger-live/pull/25596) [`9926208`](https://github.com/LedgerHQ/ledger-live/commit/99262089b408c9423f7c0f0507009fee7c89f84b) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the zero-address `verifyingContract` to the Predictions account binding's EIP-712 domain, so the device can find its clear signing descriptor in the CAL

- [#25242](https://github.com/LedgerHQ/ledger-live/pull/25242) [`d31eec1`](https://github.com/LedgerHQ/ledger-live/commit/d31eec1e59aab0eda7eef99482af65dcc0510b69) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show a filled Predictions order's market and amounts: `custom.predictions.signOrder` takes a `display` (event and market titles, outcome and its Yes / No side, image on Polymarket's image host only). A filled order's description says what was bought for the amount signed ("You bought 16.13 shares for $5.00", or "You paid $5.00"), with the market under it; other statuses don't show the market

- [#25477](https://github.com/LedgerHQ/ledger-live/pull/25477) [`9c3c1a4`](https://github.com/LedgerHQ/ledger-live/commit/9c3c1a456a6b7d1506c929888d876c2c027e636d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Sign Predictions sales in the native sheet

- [#25158](https://github.com/LedgerHQ/ledger-live/pull/25158) [`97d46f8`](https://github.com/LedgerHQ/ledger-live/commit/97d46f861b980f0065039b5c9b08a6fd5f69f3c0) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.signOrder` and `custom.predictions.reportOrder`: Ledger Wallet signs the Predictions buy order on the device in its own sheet, accepting only MoonPay's `BoxPolymarketPlaceOrder` authorization for an all-or-nothing buy and refusing to sign it once expired, then shows the order's result: in the same dialog on desktop, and on mobile on its own page once the locked "Placing your order" sheet has gone. `signOrder` answers a `walletOrderId` that `reportOrder` takes with the order's `status`, so a late report can't reach a newer order

- [#25157](https://github.com/LedgerHQ/ledger-live/pull/25157) [`c49c8df`](https://github.com/LedgerHQ/ledger-live/commit/c49c8dfd7fbb1649ad65a8b8c079dfabc30071e2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Share the Predictions account binding's signing prompt and the trading wallet setup sheet, ahead of order signing. An unknown or non-EVM account now rejects with `PredictionsAccountNotFound` (was `PredictionsBindingAccountNotFound`)

## 0.4.2

### Patch Changes

- Updated dependencies [[`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906)]:
  - @features/platform-device-intent@5.6.0

## 0.4.2-next.0

### Patch Changes

- Updated dependencies [[`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906)]:
  - @features/platform-device-intent@5.6.0-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`91056c1`](https://github.com/LedgerHQ/ledger-live/commit/91056c17c325bf042f6449c3ed74412adcb84899)]:
  - @features/platform-device-intent@5.5.0

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
