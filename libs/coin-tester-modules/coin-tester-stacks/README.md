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

- **Devnet boot fails today: `bitcoin-node` container never starts.** A real `clarinet integrate`
  run (with a working Docker daemon) gets past deployment-plan computation and into the actual
  boot sequence, then fails immediately:
  ```
  Aug 13 11:15:10.383 ERRO Fatal: unable to start bitcoind container: JsonSerdeError { err: Error("expected value", line: 1, column: 1) }
  error: unable to start bitcoind container: JsonSerdeError { err: Error("expected value", line: 1, column: 1) }
  ```
  This is a Docker-API JSON-decode failure inside Clarinet's own container orchestration (a
  `bollard` client call getting a non-JSON/empty response), surfaced when running the published
  `linux/amd64` `clarinet` image (there is no `arm64` build) under emulation on an Apple Silicon
  Docker Desktop host talking to the mounted host socket. **Ruled out**: forcing `--platform
  linux/amd64` on the outer `docker run` plus `DOCKER_DEFAULT_PLATFORM=linux/amd64` in its
  environment (so any docker-cli/API calls Clarinet makes internally for its sibling containers
  also default to amd64) — tried and reproduced the identical error at the identical point
  (`bitcoin-node - booting` → the same `JsonSerdeError`), so a bare platform mismatch on the
  *outer* container is not the cause; not kept in `src/devnet.ts` to avoid suggesting a fix that
  doesn't work. Remaining candidate: something in how `--network host` interacts with Docker
  Desktop for Mac's VM networking for this specific docker-outside-of-docker container, or an
  issue inside the `bitcoind` container's own start sequence regardless of platform. No
  `coin-tester-*` module has used Clarinet before, so there's no established pattern for this repo
  to compare against; needs a further spike (ideally on a native Linux Docker host, matching what
  CI actually runs on) before the scenario itself (signing/broadcast/sync) can be exercised at all.
  Earlier in the same investigation, a first attempt hit a *different*, now-fixed problem: this
  package's `Devnet.toml` didn't match Clarinet's bundled snapshot's default `pox_stacking_orders`,
  which drops into an interactive `Do you want to continue? (y/N)` confirmation on stdin regardless
  of `--from-genesis` (verified in `clarinet`'s own `cli.rs`: the compatibility check runs
  unconditionally, before that flag is even consulted) — fixed by keeping Clarinet's own default
  `wallet_1`/`wallet_2`/`wallet_3` accounts and stacking orders in `settings/Devnet.toml` verbatim,
  even though this package's scenario doesn't stake, so the compatibility check reports no
  differences and the prompt never fires.
- **Possible address-version mismatch in `coin-stacks`'s legacy bridge, independent of Clarinet.**
  `bridge/synchronization.ts`'s `getAccountShape` derives the account's `freshAddress` via
  `getAddressFromPublicKey(pubKey)` with no explicit `TransactionVersion`, which defaults to
  `TransactionVersion.Mainnet` — producing a mainnet-styled (`SP…`) address regardless of the
  transaction's own `network` field. A Clarinet devnet (like testnet) expects/produces
  testnet-styled (`ST…`) addresses for the same key. If this API surface is in fact
  version-sensitive end to end (unverified without a live run), account sync would never observe
  the devnet's actual balance/transactions for the funder account, and every `expect` in
  `src/scenarii/stacks.ts` would fail regardless of whether the devnet itself is healthy. Fixing it
  would mean threading the transaction's network into that one `getAddressFromPublicKey` call in
  `bridge/synchronization.ts` — out of scope for this package (the only in-scope `coin-stacks`
  change is the additive `devnet` entry in `network/api.ts`). Flagging as a candidate follow-up
  rather than silently working around it.
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
