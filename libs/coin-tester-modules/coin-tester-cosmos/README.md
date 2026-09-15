# @ledgerhq/coin-tester-cosmos

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the testing infrastructure for Cosmos-SDK chains in Ledger
Live, reusing the cosmos coin module end to end against local devnets. Three
scenarios run:

- **Cosmos Hub (`ATOM`)** — the canonical, non-epoched cosmos chain
- **Babylon (`BABY`)** — an `x/epoching`-wrapped chain
- **Gonka (`GNK`)** — send-only: its validator set is Proof-of-Compute driven
  and overrides `x/staking`, so the chain rejects delegation outright. It also
  exercises the zero-gas-price path (`minimum-gas-prices = "0ngonka"`)

## Features

- Cosmos Hub and Babylon each cover send, delegate, and claim rewards end to
  end against a local node; Gonka covers send only (see above)
- Babylon staking is `x/epoching`-wrapped; the wrapped **delegate** is exercised
  there. Wrapped **undelegate / redelegate** are crafted correctly but don't yet
  execute on the devnet (accepted into a block but no-op at the epoch boundary —
  see the note in `src/scenarii/Babylon.ts`), so they're omitted pending a
  follow-up investigation. Cosmos Hub staking is immediate (no epoching)
- Local software signer written in TypeScript (matches the DMK signer's wire
  output). It generates a **fresh random seed each run**; the devnet pre-funds
  whatever address it derives by reading `DEV_ADDRESS` from the environment at
  genesis (see `src/scenarii/*.ts` and the entrypoints)
- Docker-based devnets: single-validator `gaiad`, `babylond`, and `inferenced`
  nodes (`babylond` with a short epoch interval for fast tests)

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

Run the scenarios with `pnpm start`. The script spins up each Docker devnet,
runs the Jest test, then tears the devnet down.

### Devnet topology

All three are single-`gaiad`/`babylond`/`inferenced`-service devnets: one
validator with 100% voting power reaches the 2/3 quorum and finalises blocks
alone, so no peering is needed. State lives in the container filesystem and is
discarded on teardown. The three never run concurrently (Jest runs
`--runInBand`), so they can all reuse the same host ports (1317/26657/9090).

Because the three compose files share one compose project (the directory name),
an interrupted run leaves a sibling container still holding those ports, and the
next scenario's `up` would fail with `port is already allocated`. Each `up`
therefore passes `--remove-orphans`, so a leaked devnet from a previous run is
cleared instead of blocking the next one.

The flip side: a devnet you started **by hand** in this directory is an orphan
relative to whichever compose file the next scenario brings up, so an automated
run will tear it down under you. Ports are the shared resource here — freeing
them automatically and leaving a hand-started node alone are mutually
exclusive — so if you want a node to survive, run it on other ports or outside
this compose project.

- **Cosmos Hub** (`docker-compose.gaia.yml`) — `gaiad init` + a self-delegation
  gentx.
- **Babylon** (`docker-compose.yml`) — `babylond testnet --v 1` bootstraps the
  validator keys (cosmos + BLS) and a complete Babylon genesis in one call; the
  entrypoint then patches a short epoch interval for fast tests.
- **Gonka** (`docker-compose.gonka.yml`) — `inferenced init` + a self-delegation
  gentx. Gonka's fork adds a required ML-operational ("warm") key and a
  genparticipant registration to the gentx flow (`inferenced genesis gentx` /
  `patch-genesis`), and needs its bank denom metadata patched in explicitly
  (the chain's `x/inference` genesis reads it and panics without it) — see the
  comments in `coin-tester-inferenced/entrypoint.sh`.

Each entrypoint funds the tester's dev account at genesis from the
`DEV_ADDRESS` the scenario derives and exports before `compose up`.

### Image architecture

`babylond` publishes native `linux/amd64` **and** `linux/arm64` builds, so its
Dockerfile pins the multi-arch manifest **list** digest and sets no `--platform`
— each host builds for its own architecture. This matters: pinning the
amd64-only digest forced emulation, and babylond dies there instantly with
SIGILL (the container exits **132**), so the Babylon scenario could not run at
all on an Apple Silicon machine.

`gaia` and `inferenced` publish only `linux/amd64`, so those two keep an
explicit `--platform=linux/amd64` and are emulated on arm64 hosts — which works
fine for them. When bumping any of these, re-check what the tag actually ships:

```sh
docker buildx imagetools inspect <image>:<tag>
```

### Why no mock indexer

For Cosmos chains, the local node's LCD already serves transaction history via
the standard REST endpoints, which `@ledgerhq/coin-cosmos`'s synchronisation
calls directly. There's no separate explorer to mock — pointing `lcd` at the
local node covers both broadcasting and history.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-cosmos
