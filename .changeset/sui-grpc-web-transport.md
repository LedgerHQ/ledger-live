---
"@ledgerhq/coin-sui": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"@shared/env": minor
"@ledgerhq/live-env": minor
"@ledgerhq/types-live": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add a gRPC-web transport to the Sui coin module

- `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability:
  checkpoints, blocks, balances, operations history, system state, validators, delegated stakes, APY,
  fee simulation, transaction building, broadcast and device signing.
- Device signing follows the transport flag instead of always constructing a JSON-RPC client.
- New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
  replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised flag value resolves
  to `json`.
- New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`.
- `@mysten/sui` 2.9.0 → 2.23.1.
- Transport-neutral staking maths move from `network/graphql/utils.ts` to `network/staking.ts`.
- Operation `blockHash` carries the real checkpoint digest on gRPC, resolved with one
  `ListCheckpoints` call per page rather than JSON-RPC's per-checkpoint fan-out.
- The live shape-parity suite now compares gRPC against GraphQL; JSON-RPC keeps its own suite.
- Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
  `Headers` instance.
- Fix: GraphQL resolved the latest checkpoint in two queries, so the tip could advance past what the
  checkpoint index had and the second query answered null. It is now a single query.
- A checkpoint whose `digest` or `timestamp` is absent now raises an error on both GraphQL and gRPC.
  Both previously reported the block with an empty hash and a 1970 timestamp, which sync stored as
  though it were real.
- Degradation telemetry keeps its per-transport keys: GraphQL still logs `sui-graphql:*`, and the
  gRPC arm logs the same events under `sui-grpc:*`.
- Fix: paging operation history skipped transactions that shared a checkpoint with the page cursor.
  Both the GraphQL and gRPC arms excluded the cursor's own checkpoint from the next query, so when a
  page boundary fell inside a checkpoint holding several of an account's transactions, the remainder
  never appeared. The bound now includes that checkpoint and the already-seen items are filtered
  client-side, with a guard for the case where one checkpoint fills a whole page.
