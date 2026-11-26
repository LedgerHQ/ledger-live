# @features/platform-wallet-api-sign

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Cross-platform orchestration for Wallet API `transaction.sign` and `message.sign` when those flows
run through the Device Intent Executor.

## What it owns

- **`useWalletApiSignAssignment` / `useWalletApiSignEnabled`** — resolves
  `llmWalletApiDeviceIntentSign` or `lldWalletApiDeviceIntentSign` against a live-app manifest id
  (exact match only; no wildcard).
- **`resolveWalletApiTerms`** — looks up provider terms and privacy URLs from maps the app injects
  (the swap provider maps live in `live-common` and stay there).
- **`useDeviceIntentSignRequest`** — prepares device initialization and the sign intent, stores the
  signed result reported through the intent's `onResult`, and settles success on
  `onIntentJobComplete`. Closing on an executor error screen returns the job error, or the executor
  failure when it counts as one, instead of a plain cancel.
- **`useWalletApiSignatureQueue`** — queues transaction and message sign requests first in first out
  and shows one at a time, so two requests never drive the device at once. A late close of a settled
  request never drops the next one.
- **`getSignatureSourceFlow`** — the analytics source flow of a request: `wallet_connect` for the
  Wallet Connect live app, whose manifest id the app injects, else `wallet_api`.

## Consumers

Ledger Wallet Desktop and Mobile webview hosts (`WalletApiSignature` drawers / dialogs) and their
terms footers. Apps inject bridge, ensure-app-ready and the sign-intent platform definitions, which
still live in `libs/ledger-live-common` (`signTransactionIntentDefinition`,
`signMessageIntentDefinition`).
