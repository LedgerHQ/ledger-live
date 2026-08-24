# @ledgerhq/coin-tester-kaspa

Deterministic integration tester for `@ledgerhq/coin-kaspa`. Validates the sync/craft/sign/broadcast
path against a real local Kaspa node (kaspad + kaspa-rest-server in Docker), without Ledger Live UI,
without real funds, and without external network calls.

## Prerequisites

- Docker and Docker Compose v2
- `pnpm install` at the repo root

## Running

```sh
pnpm coin:tester:kaspa start
```

This spins up kaspad in simnet mode plus a kaspa-rest-server, runs all scenario transactions for both
`legacy` and `generic-adapter` bridge strategies, then tears down the containers.

## Architecture

- `src/signer.ts` — local BIP32/Schnorr signer (no hardware wallet, no Speculos)
- `src/kaspaNode.ts` — Docker lifecycle (spawn/kill/mine/wait); `mineBlocks()` supports an
  optional `payAddress` override so confirmation-only blocks can be sent to a throwaway address
- `src/addressUtils.ts` — `kaspa:` ⇄ `kaspasim:` bech32 re-encoding (decode + recompute checksum,
  not a text substitution — the checksum is a function of the prefix string)
- `src/fixtures.ts` — constants, account builders, and an MSW interceptor that normalizes every
  `kaspasim:` address in local REST responses to `kaspa:` before the coin module sees it
- `src/helpers.ts` — `getBridges()` for both bridge strategies
- `src/scenarii/kaspa.ts` — scenario: 4 transactions (fixed send, custom fee, multi-UTXO, send-max)
- `src/negativeCases.test.ts` — status/validation checks that don't fit the happy-path scenario
  runner (insufficient funds, invalid address, dust limit)
- `src/globalSetup.ts` / `src/globalTeardown.ts` — start/stop the Docker stack once per Jest run
- `docker-compose.yml` — kaspad (simnet) + postgres + indexer + kaspa-rest-server + miner sidecar
- `miner/` — a from-scratch miner built on the official Kaspa WASM SDK, since rusty-kaspa v2.0.1
  ships without a built-in one

## Design notes

- **Coinbase maturity is a real kaspad consensus rule** (~1000-block confirmation depth), not
  configurable away — `setup()` mines a 1000-block gap to satisfy it, sent to a throwaway address
  (not the tracked test address) so it doesn't inflate the account's own transaction history.
- **`SETUP_BLOCKS` (100) is deliberately small.** Kaspa's simnet has no debug balance-injection
  RPC (unlike EVM's `anvil_setBalance`), so funding an account means actually mining real blocks —
  each one a transaction. Keeping this low avoids pushing the tracked address past the Kaspa REST
  API's 500-item page cap, which would require the coin module to paginate across multiple pages
  on every sync (a real, separate, framework-level limitation — see the code comments in
  `coin-kaspa/src/logic/history/listOperations.ts` for details, not reproduced here to avoid
  drifting out of sync with the actual code).
- **`kaspa-miner` is built from a local Dockerfile**, not pulled from a registry — unlike this
  repo's other coin-testers. `docker compose down` never removes images (only
  containers/networks/volumes), so `spawnKaspaNode()` passes `--build` on every `up` to guarantee
  local `miner.js` changes actually take effect.
