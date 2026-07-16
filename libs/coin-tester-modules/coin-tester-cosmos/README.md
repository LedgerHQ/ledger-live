# @ledgerhq/coin-tester-cosmos

This package contains the testing infrastructure for Cosmos-SDK chains in Ledger
Live, reusing the cosmos coin module end to end against local devnets. Two
scenarios run:

- **Cosmos Hub (`ATOM`)** — the canonical, non-epoched cosmos chain
- **Babylon (`BABY`)** — an `x/epoching`-wrapped chain

## Features

- Each scenario covers send, delegate, and claim rewards end to end against a
  local node
- Babylon staking is `x/epoching`-wrapped; the wrapped **delegate** is exercised
  there. Wrapped **undelegate / redelegate** are crafted correctly but don't yet
  execute on the devnet (accepted into a block but no-op at the epoch boundary —
  see the note in `src/scenarii/Babylon.ts`), so they're omitted pending a
  follow-up investigation. Cosmos Hub staking is immediate (no epoching)
- Local software signer written in TypeScript (matches the DMK signer's wire
  output). It generates a **fresh random seed each run**; the devnet pre-funds
  whatever address it derives by reading `DEV_ADDRESS` from the environment at
  genesis (see `src/scenarii/*.ts` and the entrypoints)
- Docker-based devnets: a single-validator `gaiad` node and a single-validator
  `babylond` node (the latter with a short epoch interval for fast tests)

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { CosmosScenario } from "@ledgerhq/coin-tester-cosmos/scenarii/Cosmos";
import { BabylonScenario } from "@ledgerhq/coin-tester-cosmos/scenarii/Babylon";

await executeScenario(CosmosScenario);
await executeScenario(BabylonScenario);
```

## Development

Run the scenarios with `pnpm start`. The script spins up each Docker devnet,
runs the Jest test, then tears the devnet down.

### Devnet topology

Both are single-`gaiad`/`babylond`-service devnets: one validator with 100%
voting power reaches the 2/3 quorum and finalises blocks alone, so no peering is
needed. State lives in the container filesystem and is discarded on teardown.

- **Cosmos Hub** (`docker-compose.gaia.yml`) — `gaiad init` + a self-delegation
  gentx.
- **Babylon** (`docker-compose.yml`) — `babylond testnet --v 1` bootstraps the
  validator keys (cosmos + BLS) and a complete Babylon genesis in one call; the
  entrypoint then patches a short epoch interval for fast tests.

Each entrypoint funds the tester's dev account at genesis from the
`DEV_ADDRESS` the scenario derives and exports before `compose up`.

### Why no mock indexer

For Cosmos chains, the local node's LCD already serves transaction history via
the standard REST endpoints, which `@ledgerhq/coin-cosmos`'s synchronisation
calls directly. There's no separate explorer to mock — pointing `lcd` at the
local node covers both broadcasting and history.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-cosmos
