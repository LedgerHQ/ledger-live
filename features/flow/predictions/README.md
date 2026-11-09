# @features/flow-predictions

> [!CAUTION]
> **Status: UNSTABLE** — New package; the Predictions onboarding sheet is still being designed.

The sheets Ledger Wallet shows over the Predictions live app, a Lumen `Dialog` on web and a `QueuedBottomSheet` on native:

- the onboarding: intro, terms and consent steps, one after the other in the same sheet;
- the trading wallet setup, once the user signed the account binding: a loading, then how it ended.

## Usage

Mount `PredictionsSheet` once at the app root, under the app's `LinkingProvider` from `@shared/linking`: the intro's "Learn more" opens its link with `useOpenLink`.

```tsx
<LinkingProvider config={linkingConfig}>
  <PredictionsSheet />
</LinkingProvider>
```

Each live app player spreads `usePredictionsSheetHooks()` into the `@features/platform-predictions` handlers' `uiHooks`, so the live app's `custom.predictions.*` calls drive the sheet. Unmounting a player closes the sheet it opened. Copy comes from the app's `predictions.onboarding.*` translation keys through `@shared/i18n`.

### Trading wallet setup

Mount `PredictionsSetupSheet` once at the app root. Each live app player calls `usePredictionsSetupHooks()`: `startSetup()` opens the sheet on the loading once the binding is signed, and its `binding.reportSetup` ui hook shows the outcome once the loading has been on screen for `MIN_SETUP_DISPLAY_MS`, so a quick answer doesn't flash past. The report resolves once the user closes the sheet. A report only reaches the setup its player started, and unmounting the player closes it. On native, the sheet comes back after a lock and closes on the Android back button. Copy comes from the app's `predictions.binding.*` translation keys.
