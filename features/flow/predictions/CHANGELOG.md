# @features/flow-predictions

## 0.2.0-next.0

### Minor Changes

- [#24449](https://github.com/LedgerHQ/ledger-live/pull/24449) [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.bindAccount` and `custom.predictions.reportSetup`: Ledger Wallet asks the user to confirm on their device that they own the account picked in Predictions, then shows the trading wallet setup the live app reports. `AnimatedHeight` now counts SVG children, like a loading spinner, so the dialog no longer clips its bottom

- [#23551](https://github.com/LedgerHQ/ledger-live/pull/23551) [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions onboarding sheet behind the custom.predictions.onboard and custom.predictions.close Wallet API methods

### Patch Changes

- Updated dependencies [[`6196234`](https://github.com/LedgerHQ/ledger-live/commit/61962349d0487b0e1f318d2ab36753befc434624), [`49ae0f6`](https://github.com/LedgerHQ/ledger-live/commit/49ae0f60632ad4ad518b8a7420ab02239f3fa144), [`52622fa`](https://github.com/LedgerHQ/ledger-live/commit/52622fa571b8c7b549d185525f4511dc3ebdfa82), [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d), [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24), [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39)]:
  - @shared/ui-info-state@0.7.0-next.0
  - @features/platform-predictions@0.4.0-next.0
  - @shared/ui-animated-height@0.3.0-next.0
