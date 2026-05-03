# @ledgerhq/coin-sui

SUI coin module for Ledger Live.

## Network transport

Read-side calls route through `withTransport(currencyId, { jsonRpc, graphql })`
in [`src/network/sdk.ts`](./src/network/sdk.ts) and switch transport based on
the `features.graphql` flag, which is owned at runtime by the central
`suiGraphqlTransport` feature flag (mirrors `ldmkCosmosSigner`). Both
`node.url` (JSON-RPC) and `node.graphqlUrl` (GraphQL) are always populated
from `live-env`; the dispatcher just picks which one to use.

| Path | Transport |
|------|-----------|
| `getAllBalancesCached`, `getCheckpoint` (sequence), `getLastBlock`, `getDelegatedStakes`, `getValidators` | GraphQL when flag on, else JSON-RPC |
| `getOperations`, `getOperationExtra`, `getListOperations`, `getBlockInfo`, `getBlock`, `getCheckpoint` (digest) | JSON-RPC — pending migration |
| `paymentInfo` (dry-run), `executeTransactionBlock` (broadcast) | Dispatched; build-side runs JSON-RPC always (see below) |
| `createTransactionFor*`, `hasGasCoinObjects`, Mysten `Transaction.build({ client })` | JSON-RPC — **always**, regardless of flag |

The last row is intentional: Mysten's `Transaction.build` requires a
JSON-RPC client unconditionally (resolves package versions, gas coin
selection, object refs). Flipping the GraphQL flag does not retire JSON-RPC
from the send flow — it only routes read-side state. Document any future
work to migrate `hasGasCoinObjects` / build-side balance lookups separately.

The remaining JSON-RPC read paths can migrate: the [Sui GraphQL docs](https://docs.sui.io/develop/accessing-data/graphql/query-with-graphql)
expose `transactionBlocks`, `transactionBlock`, `dryRunTransactionBlock`, and
`executeTransactionBlock` on mainnet. They aren't in our local
[`introspection.json`](./src/network/graphql/introspection.json) yet because
codegen tree-shakes the schema to the queries we author in `src/network` —
add the document, re-run codegen, and the type surface follows.

## Default-on rollout

Flip the `suiGraphqlTransport` feature flag (defined centrally in
`types-live` + `defaultFeatures`, propagated to the coin module via
`setSuiGraphqlEnabled` in [`families/sui/setup.ts`](../../ledger-live-common/src/families/sui/setup.ts)).
Both URLs are already populated from `live-env`; nothing else to wire.
JSON-RPC remains the safe default while the flag is off.

## Schema regeneration

Re-fetch the upstream schema and prune to our queries:

```sh
pnpm --filter @ledgerhq/coin-sui graphql:codegen:fetch
```

Drift surfaces as a diff in `src/network/graphql/introspection.json` and
`graphql-env.d.ts`. The schema-availability tests in
[`utils.test.ts`](./src/network/graphql/utils.test.ts) catch removed queries.
