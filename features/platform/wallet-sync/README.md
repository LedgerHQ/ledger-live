# @features/platform-wallet-sync

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Platform-level orchestration for Ledger Live wallet synchronisation.

Wires together `@shared/cloud-sync` (network), `@shared/cloud-sync-module` (aggregation) and the domain entity modules into a runnable watch loop. Exports:

- `createWalletSyncWatchLoop` — drives push/pull cycles using a `CloudSyncSDKInterface`
- `makeSaveNewUpdate` / `makeLocalIncrementalUpdate` — helpers for processing incoming sync events and dispatching Redux actions
- `trustchainLifecycle` / `liveSlug` — lifecycle hooks called on trustchain rotation
- `createLedgerSyncMiddleware` — builds the store's Ledger Sync services on the first request, from the platform parts the app passes in
- `getLkrpSdk` / `getCloudSyncSdk` / `getLkrpQrCode` / `getLedgerSyncStatus` — hand those services to hooks through `dispatch`: the two SDKs, the QR code pairings and the backend status
- `startLedgerSyncWatch` / `stopLedgerSyncWatch` / `refreshLedgerSync` — run the watch loop in the middleware while the app is mounted, and ask it for an early sync
- `ledgerSyncReducer` / `selectLedgerSyncVisualPending` / `selectLedgerSyncError` — what the loop shows of its runs, under `state.ledgerSync`
- `useLedgerSyncWatch` / `useWalletSyncUserState` — run the watch loop while the app root is mounted, and read what it shows with the user's refresh

## Related documentation

- [The watch loop](./../../docs/ledger-sync/06-watch-loop.md) — continuous sync lifecycle inside apps
- [App integration](./../../docs/ledger-sync/07-app-integration.md) — Desktop & Mobile Redux/React wiring
- [User-facing errors](./../../docs/ledger-sync/errors.md) — errors surfaced in sync hooks
- [Test strategy](./../../docs/ledger-sync/test-strategy.md) — layered testing approach

## Code location

Moved from `libs/live-wallet/src/walletsync/` (watch loop, incremental updates, trustchain lifecycle).
