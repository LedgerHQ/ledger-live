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
  signed result on the `signed` job state, and settles success on `onIntentJobComplete`.
- **`useReplaceableSignRequests`** — tracks active transaction and message sign entries by request
  id, settles replaced requests via app-injected callbacks, and ignores stale close events.

## Consumers

Ledger Wallet Desktop and Mobile webview hosts (`WalletApiSignature` drawers / dialogs) and their
terms footers. Apps inject bridge, ensure-app-ready and the sign-intent platform definitions, which
still live in `libs/ledger-live-common`.
