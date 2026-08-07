# @ledgerhq/coin-tester-near

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for the NEAR family. Starts a local `near-sandbox` node and runs
one scenario through both the legacy account bridge and the generic coin-framework bridge
(Alpaca/`CoinModuleApi`), so the two are compared against each other on every run.

## Run

```sh
pnpm coin:tester:near start
```

No Docker required: `near-sandbox` downloads a native binary for the host platform on first run
(Darwin arm64 and Linux x86_64 are both published). The coin module must be built first
(`pnpm --filter @ledgerhq/coin-near build`).

## Coverage

- transfers to an existing named account and to a fresh implicit account
- staking: delegate, undelegate, and withdraw after the unlock period
- the account's balance breakdown and operation history after each transaction

## How it works

**Node.** `near-sandbox` is a build of `neard` carrying the `sandbox` feature, which adds the
`sandbox_fast_forward` RPC. Genesis is left untouched — shrinking `epoch_length` to speed up the
staking unlock stops the node from ever becoming ready, so block height is advanced explicitly
instead.

The node sometimes keeps a socket open and never completes its shutdown, which holds the event loop
open long after the assertions are done. Teardown is therefore bounded by a timeout, and the run uses
`--forceExit`, as the polkadot and stellar testers do for the same reason. `near-sandbox` exposes no
handle on the process, so there is nothing to kill directly; the RPC port is picked per run, so a
leftover node never collides with the next one.

**Staking pool.** NEAR staking runs through a contract rather than the protocol, so the scenario
deploys `staking_pool.wasm` from `near/core-contracts` and delegates to it. The download is pinned to
a commit and checked against its sha256, so neither upstream nor a stale cache can swap the contract
out from under the run. The pool logs a
`minimum_stake` failure once per epoch because it also tries to become a protocol validator with far
less than the seat price; that is expected and does not affect delegation.

**Indexer.** The coin module reads its history, gas price, staking deposits and validator list from
an indexer that no local node provides, so those four endpoints are served by an `msw` stub built
from the sandbox's own state. `/v3/stats` is stubbed too, despite `getGasPrice` having a node-RPC
fallback: that fallback only covers a response without a `gas_price`, not a request that throws, and
an unstubbed host fails DNS resolution long before it is reached.

**Signing.** The local signer signs `sha256` of the Borsh-serialized transaction, which is what the
device app does. Signing the raw payload produces a signature the network rejects at broadcast.
