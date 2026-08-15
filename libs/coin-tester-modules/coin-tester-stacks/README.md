# @ledgerhq/coin-tester-stacks

End-to-end coin tester for Stacks: signs and broadcasts real transactions against a local
[Clarinet](https://github.com/stx-labs/clarinet) devnet and asserts on the resulting account state,
following the same `Scenario`/`executeScenario` contract as every other `coin-tester-*` package
(`libs/coin-tester/src/main.ts`).

```
pnpm coin:tester:stacks start
```

## Scope

This package tests the **legacy bridge only**, against a **local Clarinet devnet**, covering:

- Native STX send (fixed amount and send-max).
- SIP-010 token send (fixed amount and send-max), against `contracts/sip-010-test-token.clar`, a
  minimal SIP-010 contract deployed at devnet genesis (a fresh devnet has no fungible token
  deployed at all, unlike VeChain's VTHO or NEAR's staking-pool WASM, which pre-exist on their
  respective test networks).

There is no `generic-adapter` coverage and no staking (delegate/undelegate) coverage. Both are
absent for the same underlying reason, not two separate decisions: on this branch, `coin-stacks`
(`libs/coin-modules/coin-stacks`) has no `generic-adapter`/`CoinModuleApi` wiring and no pox-5
staking support at all — `supportedFeatures.blockchain_txs` is `["send"]`. (A separate,
already-in-review branch adds an Alpaca/`CoinModuleApi` migration with staking support; this
package was scoped and implemented against `develop`, independently of that branch, per the task
that produced it.)

## Known limitations (discovered while implementing)

Several real, upstream `clarinet` bugs were found and fixed via a pinned, patched build (see
`docker/clarinet/`) — no manual local setup needed, `spawnDevnet()` (`src/devnet.ts`) builds and
caches the patched binary automatically on first use (via Docker on Linux, extracting the built
binary — no host Rust toolchain needed there; via a local `cargo +nightly` build elsewhere, e.g.
macOS, since a container-built Linux binary can't run natively there). One further `clarinet` bug
(sustained block mining sometimes stalling, see below) could not be source-patched the same way —
its root cause inside `clarinet`'s own Rust orchestrator was not found despite substantial
investigation — so it is **worked around** instead, from this package's own code
(`scripts/bitcoin-miner.js`), not silently left broken. A CI-only devnet-boot failure (`bitcoind`
crashing on a host/container UID mismatch, see below) was root-caused and fixed by adjusting the
bind-mounted data directory's permissions — pending confirmation on the next CI run before calling
it closed, consistent with two earlier timeout-based attempts that looked plausible but didn't
actually fix it (and one same-day config-only attempt — disabling the bind mount entirely — that
fixed the permission error but exposed a second, previously-masked bug: bitcoind's container CMD
launches immediately on `docker start`, before clarinet's own post-start `mkdir` exec call runs, so
without the bind mount's directory already existing at that point, bitcoind fails immediately with
"data directory does not exist" instead).

### Devnet infrastructure — real, fixed `clarinet` bugs

The published `ghcr.io/stx-labs/clarinet` image is `linux/amd64`-only and, under QEMU emulation on
Apple Silicon, its own `bollard` Docker-API client fails on certain calls (`JsonSerdeError { err:
Error("expected value", ...) }` — an empty/malformed response it can't parse). This is **not** a
code bug in this package: it was root-caused by building `clarinet-cli` natively (`cargo build
--release`, arm64, from `stx-labs/clarinet`'s own source) and confirming `bitcoin-node` then boots
and mines correctly.

- **`bollard` (Clarinet's Docker-API client) is pinned to `0.17`, which mis-parses some Docker
  Engine API responses as empty JSON** — this is what produced the `JsonSerdeError` above for the
  `postgres` container too (not just an emulation artifact: it reproduced identically on the
  native arm64 build, and being an HTTP JSON-parsing bug unrelated to CPU architecture is expected
  to reproduce on amd64/CI too). Bumping to `bollard = "0.18"` in `stacks-network`'s `Cargo.toml`
  (one version below `0.21`, which removes a generic parameter `stacks-network` relies on) fixes
  the parsing and surfaces the *real* underlying error instead — which turned out to be a mundane
  local port conflict (`postgres_port` now overridden to `27432` in `settings/Devnet.toml`, since
  the default `5432` collides with other local Postgres instances on dev machines).
- **The generated `Stacks.toml`'s `[burnchain].rpc_port` is a genuine upstream typo**: it's set
  from `devnet_config.orchestrator_ingestion_port` (clarinet's own event-listener port) instead of
  `devnet_config.bitcoin_node_rpc_port` (bitcoind's actual RPC port) — see
  `orchestrator.rs`'s burnchain-config template. `stacks-node` then tries to reach bitcoind on the
  wrong port and its burnchain sync never completes (`Bitcoin RPC failure: error listing utxos ...
  Connection refused`, indefinitely). Fixed in the patch by using the correct field.
- **Contract `epoch` pinned to `"3.0"`** instead of `"latest"` (`Clarinet.toml`) — `"latest"`
  resolved to a deployment batch the devnet doesn't reliably reach within a short scenario run.
- **`clarinet` gives up waiting on the `bitcoind` container after ~15s** (`MAX_ERRORS: u32 = 30`,
  polled every 500ms in `orchestrator.rs`) and treats that as fatal, tearing the whole devnet
  network down. Bumped to `600` (~5min) in the patch as a legitimate safety margin (a cold image
  pull alone can exceed 15s) — kept even though it turned out not to be this bug's actual cause
  (see below): `waitUntilReady` (`src/devnet.ts`) now also fails fast the moment the `clarinet`
  process itself exits, so a longer Rust-side budget no longer costs extra wall-clock time when
  the real problem is elsewhere.
- **CI-only: `bitcoind` itself crashed on boot with `Permission Denied`, not a networking or
  patience problem.** `bitcoin-node`'s container was created and started successfully (clarinet's
  own log reached `"Configuring bitcoin-node"`), then vanished from `docker ps -a` within seconds —
  clarinet's `HostConfig.auto_remove: true` deletes a container the instant it exits, before
  `docker logs`/`docker inspect` can see why (fixed via `bitcoin-node-no-autoremove.patch`, kept
  permanently — this package's own `killDevnet()` already cleans up every container on every
  scenario exit regardless, so nothing is left lingering). With that patch plus a `DEBUG=1` dump of
  `docker logs`/`docker inspect` *inside* `killDevnet()` itself (needed because
  `scenarii.test.ts`'s own failure handler calls `killDevnet()` — and would otherwise force-remove
  the same evidence — before the CI workflow's separate diagnostic step ever runs), the real error
  surfaced: `` Error: filesystem error: cannot create directories: Permission denied
  [/home/bitcoin/.bitcoin/regtest/wallets] ``. Root cause: `bind_containers_volumes` (`clarinet`'s
  own `network_manifest.rs`, defaults to `true`, left at default) bind-mounts each container's data
  directory from a host path that `clarinet` itself creates — owned by whatever user runs
  `clarinet` (the CI runner's own account), not by the container's `user: "1000"`. bitcoind then
  fails writing a subdirectory under it. Never reproduces locally because Docker Desktop for Mac's
  bind-mount layer doesn't enforce the same host/container UID match a real Linux Docker host does.
  Fixed via `bitcoin-node-datadir-permissions.patch` — `chmod 777` on the host directory right after
  `clarinet` creates it, before the container ever starts. (An earlier same-day attempt disabled
  the bind mount entirely instead of fixing its permissions — `bind_containers_volumes = false` —
  which does remove the UID mismatch, but exposes a *second*, previously-masked bug: without the
  mount pre-populating `/home/bitcoin/.bitcoin` as part of container start, bitcoind's own CMD
  process — launched immediately on `docker start`, before clarinet's separate post-start `mkdir`
  *exec* call can run — finds the directory missing and exits immediately with `Specified data
  directory "/home/bitcoin/.bitcoin" does not exist`. `docker exec` requires an already-running
  container, so that ordering isn't a bug to fix, it's a hard Docker API constraint — the bind
  mount was accidentally the only thing making the directory exist in time. Chmod-ing the
  bind-mounted directory instead keeps that existing synchronization and only fixes the
  permission.) Two earlier theories were checked against clarinet's own source and **ruled out**
  along the way: (a) the deprecated `clarinet integrate` command using a different/buggy code path
  than `devnet start` — `cli.rs` shows `Integrate` is a thin wrapper calling the identical
  `devnet_start()` function; (b) a race with the (skipped) snapshot-copy step — this package passes
  `--from-genesis`, which `cli.rs` maps directly to `no_snapshot: true`, so
  `copy_snapshot_to_container` never runs at all.

Four of the fixes above are Rust source fixes, captured as patches
(`docker/clarinet/bollard-fix.patch`, `docker/clarinet/bitcoin-node-patience.patch`,
`docker/clarinet/bitcoin-node-no-autoremove.patch`,
`docker/clarinet/bitcoin-node-datadir-permissions.patch`), applied on top of pinned commit
`4220f34773a20960ce955a6b76590c97751e8a60` — see `docker/clarinet/Dockerfile` for the exact build.
Epoch pinning is a `Clarinet.toml` config choice, not a source patch. Running
`clarinet` itself was deliberately kept
as a **native host process**, never inside a container: an earlier version of this fix ran
`clarinet integrate` inside a Docker image, which works for the `bollard`/`rpc_port` fixes but hits
a *different*, environment-specific problem — the sibling containers `clarinet` spawns need to
reach its own event-listener at `host.docker.internal:<port>`, and that hop is only reliable when
`clarinet` itself runs on the real host; running it inside a `--network host` container hit real
limitations of Docker Desktop for Mac's host-networking support (verified: sibling containers got
`ECONNREFUSED` reaching the orchestrator's own listener). Building the binary and then running it
directly on the host sidesteps that — Docker is still used, but only the way `clarinet` itself
already uses it (to spawn its sibling containers), not to run `clarinet` itself.

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

### `clarinet`'s bitcoin-mining scheduler stalls — worked around, not source-patched

With the `bollard`/`rpc_port` fixes above, the devnet reliably boots, syncs the burnchain, and
mines the genesis Stacks block anchored in Bitcoin block #100 — but on several runs during
verification, `bitcoin-node`'s periodic miner (`chains_coordinator.rs`'s `handle_bitcoin_mining`,
driven by `bitcoin_controller_block_time = 3_000` in `settings/Devnet.toml`) mined exactly one
further Bitcoin block (`#101`) and then never mined again: `burn_block_height` frozen at `101` for
10+ minutes straight, no further `"mining blocks"` log line, no error.

Investigation, in order:

- **Not a container-networking issue**: the orchestrator's event-listener is bound to all
  interfaces and independently verified reachable from a container via `host.docker.internal`.
- **Not specific to the deprecated `clarinet integrate` command**: `clarinet devnet start` (the
  current, non-deprecated command per Clarinet's own docs) reproduces the identical stall,
  confirming both commands share the same underlying orchestrator code.
- **Not bitcoind's fault**: manually issuing the exact same `generatetoaddress` RPC call bitcoind
  itself exposes (bypassing `clarinet` entirely) mines new blocks immediately and reliably, every
  time — proving the bitcoind side of the pipeline is healthy and the bug is in `clarinet`'s own
  scheduler.
- The Rust-level root cause inside `handle_bitcoin_mining`'s spawned thread was not found despite
  tracing every `BitcoinMiningCommand::Pause`/`Start` call site and the `create_global_snapshot`
  epoch-4.0 path (ruled out: gated behind `--create-new-snapshot`, which this package never
  passes).

**Worked around** in `scripts/bitcoin-miner.js`: a small, dependency-free script that calls
bitcoind's `generatetoaddress` directly, every `bitcoin_controller_block_time`, replacing
Clarinet's own broken scheduler. `src/devnet.ts`'s `startBitcoinMiningWorkaround` spawns it as a
**separate OS process** — an in-process `setInterval` was tried first and was itself unreliable,
because Jest's own CPU-bound work (signing, `--runInBand` test execution) delays or starves the
shared event loop long enough to occasionally miss ticks for minutes, indistinguishable from the
original bug from the test's point of view. A separate process has its own event loop, unaffected
by Jest's load. Verified via multiple consecutive full scenario runs after this fix.

### Other

- **`@stacks/network`/`@stacks/transactions` are pinned at `6.17.0`** (matching what `coin-stacks`
  itself declares on `develop`), not `7.x` — `StacksDevnet` is the `StacksMocknet` alias in this
  version, with the same default URL (`http://localhost:3999`, matching Clarinet's own default
  `stacks_api_port`).

## Accounts

`settings/Devnet.toml` funds several of Clarinet's own well-known, public, deterministic devnet
accounts — not a secret specific to this package. The `deployer` account doubles as the scenario's
funder: `contracts/sip-010-test-token.clar` mints its entire test-token supply to `tx-sender` at
deploy time, i.e. to whichever account the deployment plan uses to publish it (the manifest's
`deployer`, since the contract entry sets no override) — reusing it as the sender avoids a separate
on-chain token-funding transaction before the scenario starts. `wallet_2` is the scenario's
recipient. `wallet_1`/`wallet_3` and the `[[devnet.pox_stacking_orders]]` block are **not used by
the scenario** — they exist only because Clarinet's bundled devnet snapshot is keyed to that exact
default stacking configuration (see "Known limitations" above); removing them reintroduces an
interactive confirmation prompt on `clarinet integrate`.
