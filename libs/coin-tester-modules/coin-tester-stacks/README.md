# @ledgerhq/coin-tester-stacks

End-to-end coin tester for Stacks: signs and broadcasts real transactions against a local
[Clarinet](https://github.com/stx-labs/clarinet) devnet and asserts on the resulting account state,
following the same `Scenario`/`executeScenario` contract as every other `coin-tester-*` package
(`libs/coin-tester/src/main.ts`).

```
pnpm coin:tester:stacks start
```

## Scope

This package tests `coin-stacks` against a **local Clarinet devnet**, through both bridge
strategies (`src/scenarii.test.ts`):

- **Send scenario**, run once with the legacy bridge and once with the generic-adapter
  (`CoinModuleApi`) path:
  - Native STX send (fixed amount and send-max).
  - SIP-010 token send (fixed amount and send-max), against `contracts/sip-010-test-token.clar`, a
    minimal SIP-010 contract deployed when the devnet boots (a fresh devnet has no fungible token
    deployed at all, unlike VeChain's VTHO or NEAR's staking-pool WASM, which pre-exist on their
    respective test networks).
- **pox-5 staking scenario** (delegate/undelegate), generic-adapter only (the legacy bridge has no
  staking code), against `contracts/signer-manager-stub.clar` as the signer manager.

All three runs share **one devnet**, started once in `scenarii.test.ts`'s `beforeAll`. Runs share
the chain but **never an account**: each signs with its own sender (see "Accounts" below), so no
run starts on another's history or drained balance. A full run takes about 2 minutes once the
patched Clarinet binary is built.

## How the devnet runs

- **Patched Clarinet, built once and cached.** `spawnDevnet()` (`src/devnet.ts`) runs a patched
  `clarinet` binary (see "Clarinet patches") built from `docker/clarinet/`: inside Docker on Linux
  (extracted with `docker cp`, no host Rust toolchain needed), with a local `cargo` build elsewhere,
  e.g. macOS, since a container-built Linux binary can't run there. The binary is cached in
  `.clarinet-cache/<hash of docker/clarinet/**>/`, so changing the pinned commit, a patch or the
  toolchain rebuilds it. CI caches the same directory (`.github/workflows/test-coin-tester.yml`),
  keyed on the same inputs; a cache miss costs one ~13-minute build.
- **Clarinet runs on the host, not in a container.** The sibling containers it spawns (bitcoind,
  stacks-node, stacks-signer, stacks-blockchain-api, postgres) must reach its event listener and
  Bitcoin RPC proxy at `host.docker.internal:<port>`, which is only reliable when `clarinet` runs on
  the real host (inside a `--network host` container, Docker Desktop for Mac refused those
  connections).
- **Snapshot boot.** Clarinet embeds a chain-state snapshot that starts at burn height 163, past
  epoch 3.0 (Nakamoto, 142) and epoch 4.0 (pox-5, 162), so neither the send nor the staking
  scenario waits for an epoch transition. Clarinet extracts it to `~/.clarinet/cache/devnet/` on
  first use; the bitcoin chain state is copied into bitcoind's data directory before bitcoind starts
  (patch 5), the stacks chain state into the stacks-node container at boot. Clarinet then publishes
  this package's contracts through its deployment plan.
- **Clarinet mines the blocks.** The stacks-node reaches bitcoind through Clarinet's Bitcoin RPC
  proxy; Clarinet mines the next block whenever it relays a miner's block-commit, and on its own
  timer (`bitcoin_controller_block_time`) otherwise.
- **Diagnostics.** Without `DEBUG`, Clarinet's output goes to a log file in the OS temp directory;
  if the devnet fails to boot, its tail and every devnet container's exit state and logs are
  printed. `DEBUG=1` streams Clarinet's output live instead.

Requirements: Docker; on macOS also `rustup` (the local build installs the pinned toolchain from
`docker/clarinet/Dockerfile` itself).

## Clarinet patches

Applied in this order on top of Clarinet v3.24.1 (`ARG CLARINET_COMMIT` in
`docker/clarinet/Dockerfile`, which also carries the reasoning for each):

1. **`bollard-fix.patch`**: Clarinet's Docker-API client, `bollard` 0.17, mis-parses some Docker
   Engine API responses as empty JSON (`JsonSerdeError { err: Error("expected value", ...) }`) and
   breaks the postgres container boot. Bumped to 0.18 (0.21 removes a generic parameter
   `stacks-network` relies on), plus a retry for a postgres container that vanishes on start.
2. **`bitcoin-node-patience.patch`**: Clarinet waits only ~15s (30 × 500ms) for the bitcoind
   container before tearing the devnet down, too tight for a CI runner pulling the image cold.
   Raised to ~5 minutes.
3. **`bitcoin-node-no-autoremove.patch`**: the bitcoin-node container had `auto_remove: true`, so
   a crash deleted it before `docker logs`/`docker inspect` could show why. `killDevnet()` removes
   every devnet container anyway.
4. **`bitcoin-node-datadir-permissions.patch`**: bitcoind's data directory is bind-mounted from a
   host path Clarinet creates, owned by the user running it, while bitcoind runs as uid 1000. A
   Linux host enforces that ownership (Docker Desktop doesn't), so bitcoind couldn't create its
   directories. `chmod 777` right after Clarinet creates it.
5. **`bitcoin-node-snapshot-host-copy.patch`**: Clarinet copied the bitcoin snapshot into the
   bitcoind container with `docker cp` *after* starting it, which races bitcoind two ways. On Linux
   it couldn't read the copied files (no owner uid 1000 can use) and exited; and when it had
   already begun its own chain state, it served blocks the stacks-node's snapshot didn't expect
   (`Non-contiguous header`, intermittent). The snapshot is now copied on the host into the
   bind-mounted data directory before the container is created, and made world-readable and
   writable, so bitcoind starts on it.

**Deliberately not patched:** the generated `Stacks.toml`'s `[burnchain].rpc_port` points at
Clarinet's ingestion port. That is Clarinet's Bitcoin RPC proxy, not a typo. An earlier version of
this package redirected it straight to bitcoind, which stopped Clarinet from ever mining past the
first block and required an external miner process.

## Pinned versions

- **Clarinet** v3.24.1, and through it the stacks-node, stacks-signer and bitcoind images
  (`stacks-core:4.0.1-alpine`, `stacks-signer:4.0.1-alpine`, `lncm/bitcoind:v27.2`).
- **stacks-blockchain-api** and **postgres**, by tag and digest in `settings/Devnet.toml`: Clarinet
  defaults them to the floating `latest`/`alpine` tags, and `latest` moving to 9.3.0 on 2026-09-15
  broke every run for a week with no change on our side.
- **Rust**: base image by digest and a dated nightly in `docker/clarinet/Dockerfile`.
- Contract epochs in `Clarinet.toml`: `sip-010-test-token` at `"3.0"`, `signer-manager-stub` at
  `"4.0"` with `clarity_version = 6` (it implements a pox-5 trait).

Bump any of these deliberately, alongside a green run.

## Pitfalls

- **Keep `Devnet.toml` compatible with the snapshot.** Clarinet only uses it when `epoch_*`,
  `stacks_signers_keys` and `pox_stacking_orders` match its defaults (`DevnetDiffConfig`,
  `clarinet-files/src/devnet_diff.rs`). Any difference silently falls back to a genesis boot, ~10
  minutes slower: the missing default `stacker` stacking order is what kept this package off the
  snapshot before.
- **The deployer must not send anything before `signer-manager-stub` is deployed** (see
  "Accounts").
- **Test on Linux before trusting a devnet change.** Docker Desktop doesn't enforce ownership on
  bind mounts, so permission bugs (patches 4 and 5) only show up on a Linux host such as CI.

## Found along the way

### `coin-stacks` bugs (real, fixed in the legacy bridge, covered by unit tests)

- **The legacy bridge derived a mainnet-versioned address regardless of the transaction's
  network.** `bridge/synchronization.ts`'s `getAccountShape` called
  `getAddressFromPublicKey(pubKey)` with no explicit `TransactionVersion`, defaulting to
  `TransactionVersion.Mainnet` (a real, confirmed bug, not a hypothesis — verified live: the sync
  queried a mainnet-styled `SP…` address that was never funded, instead of the devnet-funded
  `ST…` one). Fixed additively: a new `API_STACKS_NETWORK` env var (default `"mainnet"`, so no
  behavior change for real users) lets this package set it to `"testnet"` (`env.setup.ts`),
  threading the correct `TransactionVersion.Testnet` into that one call.
- **`calculateSpendableBalance` crashed on a pending contract-call (e.g. a SIP-010 transfer).** It
  unconditionally read `tx.token_transfer.amount` for every pending mempool transaction, but only
  `token_transfer`-typed transactions have that field — a pending `contract_call` has no
  `token_transfer` at all. Fixed to only subtract the token amount when `tx_type ===
  "token_transfer"`; a contract-call still has its `fee_rate` subtracted. Covered in
  `bridge/synchronization.test.ts`.
- **A fresh devnet's fee estimator has no historical cost data for *any* payload shape**, not just
  contract-calls — verified live: `/v2/fees/transaction` returns `NoEstimateAvailable` for a plain
  native STX transfer too. There is no Clarinet-level config to switch to a non-historical
  estimator. Worked around in `coin-stacks` itself: `prepareTransaction.ts` now skips the network
  fee-estimate call when the caller has already set a positive `fee` on the transaction (additive
  only — real callers never pre-set `fee`, so mainnet behavior is unchanged). This package sets
  flat, generous per-transaction-kind fees (`scenarii/stacks.ts`) since there's no estimate to
  measure against on a fresh chain. Covered in `bridge/prepareTransaction.test.ts`.

### Other

- **`@stacks/transactions` comes from the pnpm catalog**, the same entry `coin-stacks` uses, so the
  test signers and setup transactions can't drift to another major: `coin-stacks`'s pox-5 staking
  transactions carry a post-condition type v6 can't deserialize. `@stacks/network`'s
  `STACKS_DEVNET` defaults to `http://localhost:3999`, matching Clarinet's own `stacks_api_port`.

## Accounts

`settings/Devnet.toml` funds several of Clarinet's own well-known, public, deterministic devnet
accounts — not a secret specific to this package.

| Account | Role |
|---|---|
| `deployer` | Publishes both contracts (the contract entries set no `deployer` override) and pays for the staking run's signer-manager setup. Never a scenario's sender. |
| `wallet_4` | Sender, send scenario, legacy strategy. Gets 100 CTT minted at deploy |
| `wallet_5` | Sender, send scenario, generic-adapter strategy. Gets 100 CTT minted at deploy |
| `wallet_6` | Staker, pox-5 staking scenario (`validate-stake!` accepts any staker) |
| `wallet_2` | Recipient of every send |

`wallet_4`..`6` were chosen because they are **not** in `[[devnet.pox_stacking_orders]]`, so none
of their STX is locked.

**The deployer must not send any transaction before `signer-manager-stub` is deployed.** Clarinet
signs its whole deployment plan up front with pre-assigned deployer nonces (`accounts_cached_nonces`
in `clarinet-deployments/src/onchain/mod.rs`) and broadcasts the epoch-4.0 batch only once the
chain gets there. A deployer transaction sent earlier takes that batch's nonce: the stub deploy is
rejected, and Clarinet still marks it confirmed because the account's nonce moved past the
expected one. That is why the test tokens are minted straight to `wallet_4`/`wallet_5` in
`sip-010-test-token.clar` rather than transferred from the deployer during the test.

`wallet_1`..`3` and the built-in `stacker` account are **not used by the scenarios**: they are
there because `[[devnet.pox_stacking_orders]]` must match Clarinet's defaults for the snapshot to
be used (see "Pitfalls").
