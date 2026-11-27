# @features/flow-predictions

## 0.5.0-next.0

### Minor Changes

- [#25242](https://github.com/LedgerHQ/ledger-live/pull/25242) [`d31eec1`](https://github.com/LedgerHQ/ledger-live/commit/d31eec1e59aab0eda7eef99482af65dcc0510b69) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show a filled Predictions order's market and amounts: `custom.predictions.signOrder` takes a `display` (event and market titles, outcome and its Yes / No side, image on Polymarket's image host only). A filled order's description says what was bought for the amount signed ("You bought 16.13 shares for $5.00", or "You paid $5.00"), with the market under it; other statuses don't show the market

- [#25477](https://github.com/LedgerHQ/ledger-live/pull/25477) [`9c3c1a4`](https://github.com/LedgerHQ/ledger-live/commit/9c3c1a456a6b7d1506c929888d876c2c027e636d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Sign Predictions sales in the native sheet

- [#25158](https://github.com/LedgerHQ/ledger-live/pull/25158) [`97d46f8`](https://github.com/LedgerHQ/ledger-live/commit/97d46f861b980f0065039b5c9b08a6fd5f69f3c0) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.signOrder` and `custom.predictions.reportOrder`: Ledger Wallet signs the Predictions buy order on the device in its own sheet, accepting only MoonPay's `BoxPolymarketPlaceOrder` authorization for an all-or-nothing buy and refusing to sign it once expired, then shows the order's result: in the same dialog on desktop, and on mobile on its own page once the locked "Placing your order" sheet has gone. `signOrder` answers a `walletOrderId` that `reportOrder` takes with the order's `status`, so a late report can't reach a newer order

- [#25157](https://github.com/LedgerHQ/ledger-live/pull/25157) [`c49c8df`](https://github.com/LedgerHQ/ledger-live/commit/c49c8dfd7fbb1649ad65a8b8c079dfabc30071e2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Share the Predictions account binding's signing prompt and the trading wallet setup sheet, ahead of order signing. An unknown or non-EVM account now rejects with `PredictionsAccountNotFound` (was `PredictionsBindingAccountNotFound`)

- [#25161](https://github.com/LedgerHQ/ledger-live/pull/25161) [`d407275`](https://github.com/LedgerHQ/ledger-live/commit/d40727531dcf33f855e91c216d65c23f80dcc4b4) Thanks [@kentoforik](https://github.com/kentoforik)! - Add a step test ID to the Predictions sheet dialog on desktop

### Patch Changes

- Updated dependencies [[`5c7f0ef`](https://github.com/LedgerHQ/ledger-live/commit/5c7f0ef8aaebce9ac0dcf1eb509dd0756f389b10), [`9926208`](https://github.com/LedgerHQ/ledger-live/commit/99262089b408c9423f7c0f0507009fee7c89f84b), [`d31eec1`](https://github.com/LedgerHQ/ledger-live/commit/d31eec1e59aab0eda7eef99482af65dcc0510b69), [`9c3c1a4`](https://github.com/LedgerHQ/ledger-live/commit/9c3c1a456a6b7d1506c929888d876c2c027e636d), [`97d46f8`](https://github.com/LedgerHQ/ledger-live/commit/97d46f861b980f0065039b5c9b08a6fd5f69f3c0), [`c49c8df`](https://github.com/LedgerHQ/ledger-live/commit/c49c8dfd7fbb1649ad65a8b8c079dfabc30071e2), [`5ac8385`](https://github.com/LedgerHQ/ledger-live/commit/5ac8385c5dcd43b8bc0686e6c0c98d14358c0e00)]:
  - @shared/ui-info-state@0.9.0-next.0
  - @features/platform-predictions@0.5.0-next.0
  - @shared/linking@0.5.0-next.0

## 0.4.0

### Minor Changes

- [#24613](https://github.com/LedgerHQ/ledger-live/pull/24613) [`3b117a7`](https://github.com/LedgerHQ/ledger-live/commit/3b117a73628de3dc530c2fa8cd20486c7a2718b3) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Animate the Send and Predictions dialog heights with Lumen's `animated` Dialog prop instead of `@shared/ui-animated-height`, which is removed

### Patch Changes

- Updated dependencies []:
  - @features/platform-predictions@0.4.2

## 0.4.0-next.0

### Minor Changes

- [#24613](https://github.com/LedgerHQ/ledger-live/pull/24613) [`3b117a7`](https://github.com/LedgerHQ/ledger-live/commit/3b117a73628de3dc530c2fa8cd20486c7a2718b3) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Animate the Send and Predictions dialog heights with Lumen's `animated` Dialog prop instead of `@shared/ui-animated-height`, which is removed

### Patch Changes

- Updated dependencies []:
  - @features/platform-predictions@0.4.2-next.0

## 0.3.0

### Minor Changes

- [#24473](https://github.com/LedgerHQ/ledger-live/pull/24473) [`c5d0d84`](https://github.com/LedgerHQ/ledger-live/commit/c5d0d8489518b9c5635ed8aa415eb7187f4124d9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions DevTool on desktop and mobile to inspect and reset what the Predictions onboarding stored, and preview the trading wallet setup. `@domain/entity-predictions` gets `resetPredictionsIntroSeen`

### Patch Changes

- Updated dependencies [[`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378)]:
  - @shared/ui-info-state@0.8.0
  - @features/platform-predictions@0.4.1

## 0.3.0-next.0

### Minor Changes

- [#24473](https://github.com/LedgerHQ/ledger-live/pull/24473) [`c5d0d84`](https://github.com/LedgerHQ/ledger-live/commit/c5d0d8489518b9c5635ed8aa415eb7187f4124d9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions DevTool on desktop and mobile to inspect and reset what the Predictions onboarding stored, and preview the trading wallet setup. `@domain/entity-predictions` gets `resetPredictionsIntroSeen`

### Patch Changes

- Updated dependencies [[`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378)]:
  - @shared/ui-info-state@0.8.0-next.0
  - @features/platform-predictions@0.4.1-next.0

## 0.2.0

### Minor Changes

- [#24449](https://github.com/LedgerHQ/ledger-live/pull/24449) [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.bindAccount` and `custom.predictions.reportSetup`: Ledger Wallet asks the user to confirm on their device that they own the account picked in Predictions, then shows the trading wallet setup the live app reports. `AnimatedHeight` now counts SVG children, like a loading spinner, so the dialog no longer clips its bottom

- [#23551](https://github.com/LedgerHQ/ledger-live/pull/23551) [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions onboarding sheet behind the custom.predictions.onboard and custom.predictions.close Wallet API methods

### Patch Changes

- Updated dependencies [[`6196234`](https://github.com/LedgerHQ/ledger-live/commit/61962349d0487b0e1f318d2ab36753befc434624), [`49ae0f6`](https://github.com/LedgerHQ/ledger-live/commit/49ae0f60632ad4ad518b8a7420ab02239f3fa144), [`52622fa`](https://github.com/LedgerHQ/ledger-live/commit/52622fa571b8c7b549d185525f4511dc3ebdfa82), [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d), [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24), [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39)]:
  - @shared/ui-info-state@0.7.0
  - @features/platform-predictions@0.4.0
  - @shared/ui-animated-height@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#24449](https://github.com/LedgerHQ/ledger-live/pull/24449) [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.bindAccount` and `custom.predictions.reportSetup`: Ledger Wallet asks the user to confirm on their device that they own the account picked in Predictions, then shows the trading wallet setup the live app reports. `AnimatedHeight` now counts SVG children, like a loading spinner, so the dialog no longer clips its bottom

- [#23551](https://github.com/LedgerHQ/ledger-live/pull/23551) [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions onboarding sheet behind the custom.predictions.onboard and custom.predictions.close Wallet API methods

### Patch Changes

- Updated dependencies [[`6196234`](https://github.com/LedgerHQ/ledger-live/commit/61962349d0487b0e1f318d2ab36753befc434624), [`49ae0f6`](https://github.com/LedgerHQ/ledger-live/commit/49ae0f60632ad4ad518b8a7420ab02239f3fa144), [`52622fa`](https://github.com/LedgerHQ/ledger-live/commit/52622fa571b8c7b549d185525f4511dc3ebdfa82), [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d), [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24), [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39)]:
  - @shared/ui-info-state@0.7.0-next.0
  - @features/platform-predictions@0.4.0-next.0
  - @shared/ui-animated-height@0.3.0-next.0
