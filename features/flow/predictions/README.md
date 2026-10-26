# @features/flow-predictions

> [!CAUTION]
> **Status: UNSTABLE** — New package; the Predictions onboarding sheet is still being designed.

The onboarding sheet Ledger Wallet shows over the Predictions live app: intro, terms and consent steps, one after the other in the same sheet. A Lumen `Dialog` on web, a `QueuedBottomSheet` on native.

## Usage

Mount `PredictionsSheet` once at the app root, under the app's `LinkingProvider` from `@shared/linking`: the intro's "Learn more" opens its link with `useOpenLink`.

```tsx
<LinkingProvider config={linkingConfig}>
  <PredictionsSheet />
</LinkingProvider>
```

Each live app player spreads `usePredictionsSheetHooks()` into the `@features/platform-predictions` handlers' `uiHooks`, so the live app's `custom.predictions.*` calls drive the sheet. Unmounting a player closes the sheet it opened. Copy comes from the app's `predictions.onboarding.*` translation keys through `@shared/i18n`.
