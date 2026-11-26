# @ledgerhq/coin-tester-tezos

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for `@ledgerhq/coin-tezos`. Asks coin-sandbox for an Octez node on
mainnet's protocol and TzKT, the explorer the module reads, and runs two scenarios through the generic
coin framework (`@ledgerhq/live-common/bridge/generic-coin-framework`), the bridge that ships in
production.

## Run

```sh
COIN_SANDBOX_TEZOS='--node octez@<version> --indexer tzkt@<version>' pnpm coin:tester:tezos start
```

Requires coin-sandbox's server running (`deno task server` in its repository, port 8000;
`COIN_SANDBOX_URL` for another port on localhost) and a Docker daemon. `COIN_SANDBOX_TEZOS` holds the versions to run,
as the flags of coin-sandbox's `up`: take them from the `tezos` entry of `COIN_SANDBOX_NETWORKS` in
`.github/workflows/test-coin-tester.yml`, the only place the versions are written. The Octez
version decides the protocol (coin-sandbox's `docker/tezos/README.md`). Without `COIN_SANDBOX_REGISTRY`,
the first `up` builds TzKT's `tzkt-sync` image, a few minutes.

## Coverage

Two scenarios, a tz1 (ed25519) and a tz2 (secp256k1) account, each with its own instance (`setup` asks
coin-sandbox for it, `teardown` removes it). The account gets 20 XTZ from the sandbox airdrop, its one
`IN` operation, then runs, in order:

| # | Transaction | Asserts |
| --- | --- | --- |
| 1 | Send 1 XTZ from the unrevealed account | a `REVEAL` is batched before the `OUT`; the balance drops by the value plus the reveal fee |
| 2 | Send 5 XTZ | the balance drops by the operation's value |
| 3 | Delegate to a sandbox baker | `DELEGATE` to the first baker of coin-sandbox's list |
| 4 | Undelegate | `UNDELEGATE`, the previous baker as recipient |
| 5 | Send max | at most 500 mutez left (`DUST_MARGIN_MUTEZ`) |

The transfers go to another sandbox baker, an account that exists, so no allocation fee is burned. Each
operation is synced once TzKT lists it.

## Layout

| File | Role |
| --- | --- |
| `src/sandbox.ts` | Starts the instance, lists the sandbox bakers, waits for TzKT to list an operation |
| `src/signer.ts` | Software tz1 and tz2 signers, with fresh keys per run |
| `src/helpers.ts` | `getBridges(signer)`: the generic coin framework bridges for `tezos` |
| `src/scenarii/tezos.ts` | The two scenarios |
| `src/scenarii.test.ts` | The jest entry point |
| `src/fixtures.ts` | The Tezos currency and the account shape |

The module reads the bakers from coin-sandbox's server (`baker.url`), the chain from the node
(`node.url`) and the account from TzKT (`explorer.url`).

## Limitations

`stake`, `unstake` and `finalize_unstake` are not exercised. Ledger Live signs with a software signer,
not the device: this proves the bridge and coin-tezos, not what the Tezos app accepts or shows.

## A newer protocol on a testnet

When Shadownet moves to a newer protocol than mainnet's:

1. coin-sandbox lists the Octez version that activates the new protocol (its `docker/tezos/README.md`,
   "To add an Octez version").
2. Run the scenarios against it: `COIN_SANDBOX_TEZOS='--node octez@<version> --indexer tzkt@<version>'`
   locally, or the workflow (`workflow_dispatch`, chain `tezos`) from a branch whose `tezos` flags name it.
3. Running both versions in every scheduled run needs a second matrix entry that reads its own variable:
   not built yet, since no testnet is ahead of mainnet.
