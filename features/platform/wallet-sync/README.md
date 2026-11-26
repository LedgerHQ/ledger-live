# @features/platform-wallet-sync

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Platform-level orchestration for Ledger Live wallet synchronisation.

Wires together `@shared/cloud-sync` (network), `@shared/cloud-sync-module` (aggregation) and the domain entity modules into a runnable watch loop. Exports:

- `makeSaveNewUpdate` / `makeLocalIncrementalUpdate` — helpers for processing incoming sync events and dispatching Redux actions
- `@features/platform-wallet-sync/legacy`: `createWalletSyncWatchLoop` and `trustchainLifecycle`, on v1 trustchain objects, for the web-tools trustchain playground only (deprecated: apps use `useWalletSyncWatcher` and `registerRotationReencryption`)
- `liveSlug`: the Cloud Sync name of the Ledger Wallet document; web-tools and the e2e CLI (`libs/live-e2e-shared`) read it from `@features/platform-wallet-sync/slug`, which loads nothing else
- `useWalletSyncWatcher` / `useKeyRingCloudSync`: the watch loop and the Cloud Sync client both apps share, on the `KeyRingClient` of `@features/platform-key-ring`; app-only pieces (data manager composition, bridge cache, save dispatches, logger) come in as ports
- `createKeyRingCloudSync`: Cloud Sync on a key ring stream: the key ring authenticates and encrypts, this package never sees a key
- `createRotationReencryption`: moves the Cloud Sync data to the new key on a key rotation; `registerRotationReencryption(client, config)` registers it on the key ring lifecycle once, at the composition root

## Related documentation

- [The watch loop](./../../docs/ledger-sync/06-watch-loop.md) — continuous sync lifecycle inside apps
- [App integration](./../../docs/ledger-sync/07-app-integration.md) — Desktop & Mobile Redux/React wiring
- [User-facing errors](./../../docs/ledger-sync/errors.md) — errors surfaced in sync hooks
- [Test strategy](./../../docs/ledger-sync/test-strategy.md) — layered testing approach

## Code location

Moved from `libs/live-wallet/src/walletsync/` (watch loop, incremental updates, trustchain lifecycle).
