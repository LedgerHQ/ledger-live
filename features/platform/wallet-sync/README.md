# @features/platform-wallet-sync

Platform-level orchestration for Ledger Live wallet synchronisation.

Wires together `@shared/cloud-sync` (network), `@shared/wallet-sync` (aggregation) and the domain entity modules into a runnable watch loop. Exports:

- `createWalletSyncWatchLoop` — drives push/pull cycles using a `CloudSyncSDKInterface`
- `makeSaveNewUpdate` / `makeLocalIncrementalUpdate` — helpers for processing incoming sync events and dispatching Redux actions
- `trustchainLifecycle` / `liveSlug` — lifecycle hooks called on trustchain rotation

## Related documentation

- [The watch loop](./../../docs/ledger-sync/06-watch-loop.md) — continuous sync lifecycle inside apps
- [App integration](./../../docs/ledger-sync/07-app-integration.md) — Desktop & Mobile Redux/React wiring
- [User-facing errors](./../../docs/ledger-sync/errors.md) — errors surfaced in sync hooks
- [Test strategy](./../../docs/ledger-sync/test-strategy.md) — layered testing approach

## Code location

Moved from `libs/live-wallet/src/walletsync/` (watch loop, incremental updates, trustchain lifecycle).
