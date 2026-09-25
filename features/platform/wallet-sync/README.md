# @features/platform-wallet-sync

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Platform-level orchestration for Ledger Live wallet synchronisation.

Wires together `@shared/cloud-sync` (network), `@shared/cloud-sync-module` (aggregation) and the domain entity modules into a runnable watch loop. Exports:

- `createWalletSyncWatchLoop` — drives push/pull cycles using a `CloudSyncSDKInterface`
- `makeSaveNewUpdate` / `makeLocalIncrementalUpdate` — helpers for processing incoming sync events and dispatching Redux actions
- `trustchainLifecycle` / `liveSlug` — lifecycle hooks called on trustchain rotation
- `resolveWalletSyncEnvironment` — validates the app-provided Wallet Sync environment
- `getWalletSyncEnvironmentParams` — selects paired Trustchain and Cloud Sync URLs

Apps own platform-specific configuration reads: Desktop uses
`process.env.WALLET_SYNC_ENVIRONMENT`, while Mobile uses
`Config.WALLET_SYNC_ENVIRONMENT` from its selected `.env.*` file. Node E2E helpers use
`process.env`. This package validates the supplied environment and resolves paired Trustchain and
Cloud Sync URLs through `@shared/env`.

## Related documentation

- [The watch loop](./../../docs/ledger-sync/06-watch-loop.md) — continuous sync lifecycle inside apps
- [App integration](./../../docs/ledger-sync/07-app-integration.md) — Desktop & Mobile Redux/React wiring
- [User-facing errors](./../../docs/ledger-sync/errors.md) — errors surfaced in sync hooks
- [Test strategy](./../../docs/ledger-sync/test-strategy.md) — layered testing approach

## Code location

Moved from `libs/live-wallet/src/walletsync/` (watch loop, incremental updates, trustchain lifecycle).
