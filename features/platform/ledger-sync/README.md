# @features/platform-ledger-sync

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development: the apps are moving their Ledger
> Sync hooks onto it.

The Ledger Sync product logic of both apps, shared by its journeys: activation, QR code pairing,
instances, backup deletion. Headless: the journeys and their views stay in the apps for now. It
owns the business logic Desktop and Mobile duplicated, on top of the key ring client of
`@features/platform-key-ring`. Each app keeps a thin hook with its old name that calls the one
here, and keeps its screens, navigation, the device intent rendering and its composition root.

## What it exposes

Logic only: hooks and functions, no component. Every hook takes the app's `KeyRingClient` (from
the app's `useKeyRingClient`) and reads the store through `react-redux`. Where the apps behave
differently, the difference is an explicit option, never a default that favours one app.

| Export | Use |
| --- | --- |
| `useRestoreKeyRing` | Reloads the key tree after a rotation; runs on `refetch` only |
| `useInitMemberKey` | Gives this instance a member key when it has none |
| `useLedgerSyncMembers` | The members list of the key tree; errors go to `onError` |
| `useLedgerSyncErrorRecovery` | Resets, restores or ignores after a members error, by category; `resetOnUnresolvedMembers`, `logError` |
| `useOnKeyRingRefreshNeeded` | The `onRefreshNeeded` port of the watcher; `resetOnCategories`, `readTreeIdAt` |
| `useDestroyLedgerSync` | Deletes the backup; `onBeforeReset`, `onAfterReset`, `onError` |
| `useLedgerSyncServiceStatus` | Health of the key ring backend (through the client) and of Cloud Sync; `enabled` |
| `ledgerSyncBackendsExtra`, `useLedgerSyncBackends` | The backend URLs of the app config, through the thunk `extraArgument` |
| `useKeyRingRuntime` | The key ring runtime of the thunk `extraArgument`, for the app's `createKeyRingClient` |
| `useLedgerSyncPairingHost` | Shows the QR code another instance scans; `startBinding`, `notifyPaired`, `onFailure` |
| `useLedgerSyncPairingJoin` | Joins the key tree of a scanned QR code; `onFailure` |
| `useLedgerSyncActivation`, `useLedgerSyncMemberRemoval` | The legacy (non-DIE) device calls, resolving a typed outcome |
| `useLedgerSyncResultAcceptance` | Accepts device intent results once per Ledger Sync |
| `buildAddMemberIntentInput`, `buildRemoveMemberIntentInput`, `ledgerSyncResultOrder` | Device intent inputs with the one result order of the process |
| `WalletSyncContext`, `useWalletSyncUserState` | The watch loop state; each app mounts the provider |
| `useLedgerSyncLoadingSettled` | True once the loading step waited for the watch loop |
| `LedgerSyncAnalyticsEvent`, `trackLedgerSyncActivated`, `trackLedgerSyncRejectedOnDevice` | The lifecycle events; the app passes its `flow` |
| `ledgerSyncErrorForDisplay`, `isLedgerSyncTreeGone` | Error helpers; branch on `classifyKeyRingError` of `@features/platform-key-ring` otherwise |
| `LedgerSyncBackendsMissingError` | `useLedgerSyncBackends` on a store built without `ledgerSyncBackendsExtra` |
| `LedgerSyncMembersUnresolvedError` | A members `refetch` without a member key |
| `LedgerSyncQueryKey` | The query keys, to invalidate the members list |

Results are this package's own types (`LedgerSyncMembers`, `LedgerSyncDestroy`, ...), never the
query library's.

## What stays in the apps

Screens, drawers, navigation and deep links; the page and button analytics and the `flow`
resolution; the device intent platform definitions and executors; the composition root
(`useKeyRingClient`, the v1 device bridge); `useWatchWalletSync` and `useCloudSyncSDK`, which wire
`libs/`; the feature flags, passed in as values.

## Backends

The key ring and Cloud Sync base URLs come from the `ledgerKeyRing` switch of the app config
(`apps/*/src/setup/load.ts`), never from a feature flag. Each app spreads
`ledgerSyncBackendsExtra({ keyRingApiBaseUrl, cloudSyncApiBaseUrl })` into the thunk
`extraArgument` of its store, from the configuration resolved for the session, and its hooks read
them with `useLedgerSyncBackends()`. The same `extraArgument` holds `keyRingRuntimeExtra` of
`@features/platform-key-ring`, which the key ring thunks and `useKeyRingRuntime()` read. A test
store that renders those hooks spreads both.

## Peer dependencies

`@tanstack/react-query`, `react-redux`, `@reduxjs/toolkit` and `react` are singletons of the app
bundle: the app provides the query client and the store.

## Tests

`pnpm nx run @features/platform-ledger-sync:test`. Hook tests run on jsdom with a real store and query
client, a `fakeKeyRingClient` from `@features/platform-key-ring/testing`, and MSW for the status
endpoints.
