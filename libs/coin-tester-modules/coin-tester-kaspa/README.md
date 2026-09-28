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
- `src/testAccounts.ts` — one wallet per (purpose, strategy): a history and a drain account for each
  bridge strategy, so no run sees another's transactions
- `src/scenarii/kaspa.ts` — history scenario: a multi-page history, sync checks, and 4 transactions
  (fixed send, multi-UTXO, custom fee, send-max capped at 88 inputs)
- `src/scenarii/kaspaDrain.ts` — drain scenario: send-max on an account small enough to empty
- `src/negativeCases.test.ts` — status/validation checks that don't fit the happy-path scenario
  runner (insufficient funds, invalid address, dust limit)
- `src/globalSetup.ts` / `src/globalTeardown.ts` — start/stop the Docker stack once per Jest run;
  `globalSetup` also funds every test account once (`src/chainSetup.ts`)
- `docker-compose.yml` — kaspad (simnet) + postgres + indexer + kaspa-rest-server + miner sidecar
- `miner/` — a from-scratch miner built on the official Kaspa WASM SDK, since rusty-kaspa v2.0.1
  ships without a built-in one

## Design notes

- **Coinbase maturity is a real kaspad consensus rule** (~1000-block confirmation depth), not
  configurable away — `globalSetup` mines a 1000-block gap to satisfy it, sent to the (never synced)
  recipient address rather than a tracked test account: the account's balance counts immature
  coinbase UTXOs as spendable, so a pile of them on a test account would skew "Send max". The recipient
  is also the miner's default pay address, so confirmation blocks never touch a test account either.
- **Separate accounts per strategy and purpose** (`src/testAccounts.ts`). Sharing one address made the
  second strategy run inherit the first run's sends; now each sync is checked against exactly the
  indexer's transaction count for its own address.
- **Two "Send max" cases, on purpose.** A Kaspa transaction carries at most 88 inputs, and an account
  with more than one page of history has far more UTXOs than that, so its send-max moves 88 inputs and
  keeps the rest (history scenario). Draining to a zero balance needs an account with ≤ 88 UTXOs
  (`DRAIN_BLOCKS` = 20, drain scenario).
- **`SETUP_BLOCKS` (600) deliberately exceeds one indexer page.** Kaspa's simnet has no debug
  balance-injection RPC (unlike EVM's `anvil_setBalance`), so funding an account means actually
  mining real blocks — each one a transaction. 600 of them put each history account past the Kaspa
  REST API's 500-item page, so every sync walks more than one page on both bridge strategies.
- **Funding is mined once per Jest run** (`src/chainSetup.ts`, called from `globalSetup`), back to
  back: the indexer keeps up with thousands of blocks mined at 0 ms, and setup waits on the indexer's
  transaction count — not just the balance, which kaspad serves on its own — before any sync.
- **`kaspa-miner` is built from a local Dockerfile**, not pulled from a registry — unlike this
  repo's other coin-testers. `docker compose down` never removes images (only
  containers/networks/volumes), so `spawnKaspaNode()` passes `--build` on every `up` to guarantee
  local `miner.js` changes actually take effect.
