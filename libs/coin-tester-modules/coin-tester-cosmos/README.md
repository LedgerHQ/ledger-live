# @ledgerhq/coin-tester-cosmos

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the testing infrastructure for Cosmos-SDK chains in Ledger
Live, reusing the cosmos coin module end to end against chains that
[coin-sandbox](https://github.com/LedgerHQ/coin-sandbox) runs. Three scenarios run:

- **Cosmos Hub (`ATOM`)** — the canonical, non-epoched cosmos chain (`gaia@29.0.1`)
- **Babylon (`BABY`)** — an `x/epoching`-wrapped chain (`babylon@4.6.0`)
- **Gonka (`GNK`)** — send-only: its validator set is Proof-of-Compute driven
  and overrides `x/staking`, so the chain rejects delegation outright
  (`inference-chain@0.2.16`). A Cosmos message pays 1 ngonka per gas, so the
  scenario pays a real fee

## Features

- Cosmos Hub and Babylon each cover send, delegate, and claim rewards end to
  end against a node; Gonka covers send only (see above)
- Babylon staking is `x/epoching`-wrapped; the wrapped **delegate** is exercised
  there. Wrapped **undelegate / redelegate** are crafted correctly but don't yet
  execute on the chain (accepted into a block but no-op at the epoch boundary —
  see the note in `src/scenarii/Babylon.ts`), so they're omitted pending a
  follow-up investigation. Cosmos Hub staking is immediate (no epoching)
- Local software signer written in TypeScript (matches the DMK signer's wire
  output). It generates a **fresh random seed each run**; the scenario derives the
  address and hands it to `spawn(address)`, and the sandbox's airdrop funds it
- The nodes are the ones production runs, at the version production runs, with
  the chain id and denom of the mainnet

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { CosmosScenario } from "@ledgerhq/coin-tester-cosmos/scenarii/Cosmos";
import { BabylonScenario } from "@ledgerhq/coin-tester-cosmos/scenarii/Babylon";
import { GonkaScenario } from "@ledgerhq/coin-tester-cosmos/scenarii/Gonka";

await executeScenario(CosmosScenario);
await executeScenario(BabylonScenario);
await executeScenario(GonkaScenario);
```

## Development

The scenarios need a running coin-sandbox server (`COIN_SANDBOX_URL`, default
`http://localhost:8000`). From a checkout of coin-sandbox:

```sh
deno task server
```

Then run the scenarios with `pnpm start`. Each scenario's `spawn` starts its node through the
sandbox (`POST /cosmos/<network>/up`, see `src/sandboxNode.ts`) and has the dev account funded
with an airdrop; its `kill` removes the instance, and a scenario's teardown calls it when the
scenario fails too. The three never run concurrently (Jest runs `--runInBand`).

The scenarios read the node's LCD at the endpoint the sandbox returns for the instance (its port is
allocated by the sandbox and differs from one run to the next), and `setup` builds the coin config
from it. The images come from the sandbox's registry (`COIN_SANDBOX_REGISTRY`) or are built on the
first `up`. Gaia's image exists for `linux/amd64` only, so it is emulated on arm64 hosts.

### Why no mock indexer

For Cosmos chains, the node's LCD already serves transaction history via
the standard REST endpoints, which `@ledgerhq/coin-cosmos`'s synchronisation
calls directly. There's no separate explorer to mock — pointing `lcd` at the
sandbox's node covers both broadcasting and history.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-cosmos
