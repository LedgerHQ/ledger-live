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

- `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability from
  checkpoints to device signing.
- New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
  replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised value resolves to
  `json`.
- New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`. `@mysten/sui` 2.9.0 → 2.23.1.
- Operation `blockHash` carries the real checkpoint digest on gRPC.
- Fix: account sync read a single page of history on GraphQL and gRPC, capping an account at its
  newest 50 operations for good — sync resumes from the newest stored operation and never re-reads
  what it skipped. Both arms now walk up to `TRANSACTIONS_LIMIT` (300), the depth JSON-RPC reached.
- Fix: a resumed sync on GraphQL and gRPC read backwards from the tip, so when more than
  `TRANSACTIONS_LIMIT` transactions arrived between two syncs, the ones in the middle were skipped
  and the next sync resumed above them — a permanent hole. Both arms now walk forward from the
  cursor, as the JSON-RPC arm already did, leaving anything unread newer than the next resume point.
- Fix: an account holding no operations resumed from its stored `syncHash`, so a cleared cache came
  back with only the transactions that arrived after it. Such an account now re-reads its history,
  which is also how one truncated by the bug above recovers. Token operations count as history: they
  live in the subaccounts, so a token-only account is no longer treated as empty.
- Fix: on gRPC, any failure to resolve a cursor's digest — including a transient network error — was
  read as "unknown digest", which falls back to an unbounded page from the tip and made paging report
  the end of history. Only a `NOT_FOUND` does that now; everything else propagates and is retried.
- Fix: reading history skipped transactions that shared a checkpoint with the resume point, in
  account sync (`getOperations`) as well as paging (`getListOperations`).
- Fix: paging inferred "more to come" from how many operations survived client-side filtering, which
  ended the walk early. GraphQL now reads `pageInfo`, gRPC the stream's `QueryEnd` reason.
- Fix: ascending paging on GraphQL returned the newest slice of the range instead of walking forward
  from the oldest.
- Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
  `Headers` instance.
- Fix: GraphQL resolved the latest checkpoint in two queries, so the second could answer null. It is
  now one query.
- A checkpoint missing its `digest` or `timestamp` now raises on both GraphQL and gRPC, instead of
  reporting a block with an empty hash and a 1970 timestamp.
- Known limitation: `getListOperations` resumes from a synthesised `timestamp:digest` cursor, so
  within one checkpoint a sibling whose digest sorts earlier can be skipped, and a checkpoint holding
  more than one page is stepped over rather than resumed inside. Account sync is unaffected: it
  resumes from the server's own watermark cursor.
