# @features/platform-predictions

> [!CAUTION]
> **Status: UNSTABLE** — New package; the Predictions onboarding contract may still change.

Wallet API custom handlers (`custom.predictions.*`) that let the Predictions live app open Ledger Wallet's native onboarding sheet (intro, terms and consent steps).

## How it works

The live app calls `custom.predictions.onboard` with the documents it needs the user to accept, e.g. `{ intro: {}, terms: { termsVersion, disclaimerVersion }, consent: { disclosureVersion } }` or only `{ terms }` once the terms change. Ledger Wallet shows the requested steps in one sheet, always in the intro, terms, consent order and skipping an intro the user already saw, then answers with the accepted versions: `{ isCompleted, terms?, consent? }`. A version Ledger Wallet has no text for is refused with `UnsupportedOnboardingVersion` before anything opens. `custom.predictions.close` closes the sheet and the live app.

`handlers({ uiHooks })` returns the handlers to merge into a live app player's custom handlers. Each app implements `PredictionsUiHooks`:

- `sheet.open(sheet, onCancel)` shows a `PredictionsSheet`; `sheet.onStepAccept` runs as each step is accepted, `sheet.onComplete` once the last one is, `onCancel` when the sheet closes before the last step (dismissed, closed or replaced by another one)
- `sheet.close` and `app.close` close the sheet and the live app
- `intro.isSeen` and `intro.markSeen` read and set the persisted "intro seen" flag

A sheet that closes before the last step (dismissed, replaced or closed) answers `isCompleted: false` with the versions accepted until then, so the live app can store them and resume after them. Invalid params, including an unknown document, reject with `INVALID_PARAMS`.

`PREDICTIONS_LIVE_APP_ID` is the manifest id Ledger Wallet opens for the `ledgerlive://predictions` deep link.
