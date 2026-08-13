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
