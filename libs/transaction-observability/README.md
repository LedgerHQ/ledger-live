# @ledgerhq/transaction-observability

> [!CAUTION]
> **Status: UNSTABLE** — New package, extracted from `@ledgerhq/live-common`; the API is still being designed and may change without notice.

Wide, sink-agnostic observability for the Ledger Live transaction lifecycle (sign +
broadcast), across **every** route — native send/staking, wallet-api live apps, and
partner dApps — and every coin, without touching the pure coin modules.

It provides the shared primitives; the account-bridge seam
(`wrapAccountBridge` in `@ledgerhq/live-common`) and the device-action layer emit
events into it, and each host app registers observers that forward them to a
backend (Datadog, Segment/Mixpanel, a dev console).

## Main exports

- **Observer registry** — `setTransactionObserver(fn): Unsubscribe`,
  `emitTransactionEvent(event)`, `resetTransactionObservers()`. A global
  fire-and-forget registry (modelled on `@ledgerhq/logs`) so the globally-resolved
  bridge can reach app-registered sinks. Each observer is `try/catch`-isolated: a
  broken sink can never break the transaction path.
- **Event model** — `LogEvent` (`started` / `success` / `failure`), `TransactionStage`
  (`sign` / `broadcast`), `TransactionFlow` (the technical pathway), `ProductFlow`
  (the human action: stake / unstake / restake / claim / send), and the
  `buildTransaction*Event` builders.
- **Classification** — `classifyTransactionError(error)` → `ErrorCategory` (a stable,
  countable taxonomy shared with the Earn app's classifier and the wallet-api Mixpanel
  enrichment), `deriveProductFlow`, `getTransactionType`, `getStakeTarget`.
- **Segment mapping** — `toSegmentTrackEvent(event)` maps a `LogEvent` to a
  Segment/Mixpanel `track` call (distinct event names, no raw signatures).

## Development

Run commands from the repository root.

```bash
pnpm --filter @ledgerhq/transaction-observability build
pnpm --filter @ledgerhq/transaction-observability typecheck
pnpm --filter @ledgerhq/transaction-observability test
```

Linting uses oxlint; formatting uses oxfmt (`pnpm --filter @ledgerhq/transaction-observability format`).
