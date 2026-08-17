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
- Fix: reading operation history skipped transactions that shared a checkpoint with the resume point.
  Both the GraphQL and gRPC arms excluded that checkpoint from the next query, so when a page boundary
  fell inside a checkpoint holding several of an account's transactions, the remainder never appeared.
  This affected account sync (`getOperations`) as well as paging (`getListOperations`). Both now keep
  the checkpoint in range; sync relies on `mergeOps` to dedupe re-delivered operations, and paging
  filters them client-side with a guard for a checkpoint that fills a whole page.
- Paging asks the server whether more history exists (`pageInfo` on GraphQL, the stream's `QueryEnd`
  reason on gRPC) instead of inferring it from how many operations survived that client-side filter,
  which can never fill a page once the resume point is re-fetched. On gRPC the stop reason also
  distinguishes a page that ended at the ledger tip from one cut short by the server's scan budget,
  which a page-size comparison reads as the end of history.
- Fix: account sync read a single page of history on GraphQL and gRPC, so an account was capped at
  its newest 50 operations. Sync reads history once and always resumes from the newest stored
  operation, so everything older than that first page was never requested again and the account
  showed no history before the day it was added. Both arms now walk pages up to `TRANSACTIONS_LIMIT`
  (300), the depth JSON-RPC already reached. The gRPC walk resumes from each page's watermark cursor,
  which is transaction-precise and stays exact when a page ends mid-checkpoint.
- Fix: account sync resumed from the stored `syncHash` even when the account held no operations, so a
  cleared cache (`clearAccount` empties `operations` but keeps `syncHash`) came back with only the
  transactions that arrived after that point. An account with no operations now re-reads its whole
  history, which is also how an account truncated by the single-page bug above recovers.
- Fix: ascending paging on GraphQL read the newest slice of the range instead of walking forward from
  the oldest, so it silently skipped everything in between — the page looked ascending only because
  the client re-sorted it. The query now requests a forward window (`first`/`after`) when the caller
  asks for ascending order, and takes "more to come" from `hasNextPage`. JSON-RPC and gRPC page in
  either direction natively and were unaffected.
- Known limitations, both narrower than the behaviour they replace but not eliminated: within a single
  checkpoint, "already delivered" is decided by comparing digests rather than by tracking what was
  emitted, so a sibling whose digest sorts before the resume point can still be skipped; and a
  checkpoint holding more than one page of an account's transactions cannot be resumed inside, so
  paging steps over its remainder to keep moving.
