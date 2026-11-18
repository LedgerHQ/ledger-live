# @features/flow-predictions

> [!CAUTION]
> **Status: UNSTABLE** — New package; the Predictions onboarding sheet is still being designed.

The sheets Ledger Wallet shows over the Predictions live app, a Lumen `Dialog` on web and a `QueuedBottomSheet` on native:

- the onboarding: intro, terms and consent steps, one after the other in the same sheet;
- the trading wallet setup, once the user signed the account binding: a loading, then how it ended;
- the buy order, once the user signed it: "Placing your order", then how it ended.

## Usage

Mount `PredictionsSheet` once at the app root, under the app's `LinkingProvider` from `@shared/linking`: the intro's "Learn more" opens its link with `useOpenLink`.

```tsx
<LinkingProvider config={linkingConfig}>
  <PredictionsSheet />
</LinkingProvider>
```

Each live app player spreads `usePredictionsSheetHooks()` into the `@features/platform-predictions` handlers' `uiHooks`, so the live app's `custom.predictions.*` calls drive the sheet. Unmounting a player closes the sheet it opened. Copy comes from the app's `predictions.onboarding.*` translation keys through `@shared/i18n`.

### Trading wallet setup

Mount `PredictionsSetupSheet` once at the app root. Each live app player calls `usePredictionsSetupHooks()`: `startSetup()` opens the sheet on the loading once the binding is signed, and its `binding.reportSetup` ui hook shows the outcome once the loading has been on screen for `MIN_RESULT_DISPLAY_MS`, so a quick answer doesn't flash past. The report resolves once the user closes the sheet. A report only reaches the setup its player started, and unmounting the player closes it. On native, the sheet comes back after a lock and closes on the Android back button. Copy comes from the app's `predictions.binding.*` translation keys.

### Buy order

Mount `PredictionsOrderSheet` once at the app root. Each live app player calls `usePredictionsOrderHooks()`: `startOrder()` opens the sheet on "Placing your order" once the order is signed and returns the order's id, and its `order.report` ui hook shows the outcome reported for that id after `MIN_RESULT_DISPLAY_MS`, like the setup. A filled order offers "Return to predictions"; an order that didn't fill, or that MoonPay rejected for an expired signature, a tick size or a failed workflow, offers "Try again" and "Close"; any other outcome offers "Close" only. The report resolves with `close` or `retry`, and with `close` when the sheet is dismissed, replaced, or its player unmounts, or right away for an id that isn't the player's open order. With no report after `ORDER_REPORT_TIMEOUT_MS`, the sheet shows the `unconfirmed` outcome and a later report answers `close` right away. Copy comes from the app's `predictions.order.*` translation keys.

The setup and order stores and sheets are built on a pending-result store (`createPendingResultStore`) and sheet shell (`PendingResultSheetView`), internal to this package: a sheet that loads until the live app reports an outcome, then shows it until the user closes it.
