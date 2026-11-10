# @features/platform-predictions

> [!CAUTION]
> **Status: UNSTABLE** — New package; the Predictions onboarding contract may still change.

Wallet API custom handlers (`custom.predictions.*`) that let the Predictions live app open Ledger Wallet's native onboarding sheet (intro, terms and consent steps) and its "Confirm account ownership" prompt.

## How it works

The live app calls `custom.predictions.onboard` with the documents it needs the user to accept, e.g. `{ intro: {}, terms: { termsVersion, disclaimerVersion }, consent: { disclosureVersion } }` or only `{ terms }` once the terms change. Ledger Wallet shows the requested steps in one sheet, always in the intro, terms, consent order and skipping an intro the user already saw, then answers with the accepted versions: `{ isCompleted, terms?, consent? }`. A version Ledger Wallet has no text for is refused with `UnsupportedOnboardingVersion` before anything opens. `custom.predictions.close` closes the sheet and the live app.

`handlers({ uiHooks })` returns the handlers to merge into a live app player's custom handlers. Each app implements `PredictionsUiHooks`:

- `sheet.open(sheet, onCancel)` shows a `PredictionsSheet`; `sheet.onStepAccept` runs as each step is accepted, `sheet.onComplete` once the last one is, `onCancel` when the sheet closes before the last step (dismissed, closed or replaced by another one)
- `sheet.close` and `app.close` close the sheet and the live app
- `intro.isSeen` and `intro.markSeen` read and set the persisted "intro seen" flag
- `binding.sign(accountId)` shows the "Confirm account ownership" prompt and signs the binding message with the account, and `binding.reportSetup(setup)` shows how the trading wallet setup ended, see below

A sheet that closes before the last step (dismissed, replaced or closed) answers `isCompleted: false` with the versions accepted until then, so the live app can store them and resume after them. Invalid params, including an unknown document, reject with `INVALID_PARAMS`.

`PREDICTIONS_LIVE_APP_ID` is the default manifest id of the Predictions live app, used when the `ptxPredictionsLiveAppDesktop` or `ptxPredictionsLiveAppMobile` flag sets none.

`getPredictionsWebviewInputs(linkParams, hostInputs)` builds the inputs of the Predictions screen's webview: the deep link's params (e.g. `eventSlug`), then the host context (theme, platform, …), which a link param can't override. A `goToURL` gets them in its query too, since Ledger Wallet loads a whitelisted `goToURL` as is.

## Account binding

Before the live app creates the user's trading wallet, it calls `custom.predictions.bindAccount` with `{ accountId }`, the Wallet API id of the account the user picked. Ledger Wallet signs an EIP-712 message with it on the device, which proves the user controls that account, and answers `{ typedData, signature }`. The live app checks the signature recovers to the account; it never sends it to the provider.

- The message (`getBindingTypedData`) is built here, never by the live app, so this prompt can only sign it. The device shows `ConfirmAccountOwnership`: an action, the account and the delegation notice. It isn't clear-signed yet (no descriptor), so the Ethereum app needs blind signing.
- The signature runs as a Device Intent (`predictionsBindingIntentDefinition`, in `src/bindingIntent/`): the job signs with the host-injected `signTypedData`, checks the signer (`isBindingSigner`) and reports a `bound` or `mismatch` result through `onResult`. Each app adds its renderer and mounts it in its Device Intent Executor, which shows the connection and the Ethereum app; the renderer shows the "Confirm account ownership on your <device>" prompt and keeps it from closing while the device waits. A device error (refusal, blind signing disabled, disconnection…) is a state with a retry; a signature from another key is `mismatch`.
- The app implements `binding.sign` with `createBindingSigner` (`src/bindingRequests.ts`), one per live app player, which opens the binding on the app's mounted root through its `createBindingRequests`, settles once with the first answer, and cancels only the binding it opened. The app injects what needs legacy code: finding the account (its own `findBindingAccount`, which throws `PredictionsBindingAccountNotFound` for an unknown or non-EVM account), the refusal (`UserRefusedOnDevice`) and what runs once signed (opening the setup). Its root opens the executor, signing with its own `signBindingTypedData` on the executor's DMK session (live-common's `runSignTypedDataEvm`, which cancels the device action when the executor stops). Once signed, the executor closes, the trading wallet setup of `@features/flow-predictions` opens on "Setting up your trading account", and `binding.sign` answers, so the live app sets up the wallet behind it.
- The live app then calls `custom.predictions.reportSetup` with `{ outcome: "created" | "found" }` or `{ outcome: "failed", reason }` (`failed-deploy`, `failed-permission`, `timeout`, `unavailable`, `unknown`). The app implements `binding.reportSetup` with `usePredictionsSetupHooks` of `@features/flow-predictions`, which shows that outcome and answers once the user closes it, so the live app shows what's behind only then. With no setup open, it answers right away. Closing the live app cancels its open binding and closes its setup.
- Closing the prompt before signing answers `UserRefusedOnDevice`. A signature from another key answers `PredictionsBindingSignerMismatch` right away. Invalid params reject with `INVALID_PARAMS`.
