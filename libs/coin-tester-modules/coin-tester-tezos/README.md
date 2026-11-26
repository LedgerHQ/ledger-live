# @ledgerhq/coin-tester-tezos

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for the Tezos family. Asks coin-sandbox for an Octez node on mainnet's
protocol and its TzKT (the indexer coin-tezos reads), then runs a tz1 and a tz2 scenario through the
generic coin framework (`@ledgerhq/live-common/bridge/generic-coin-framework`), the bridge that ships in
production.

## Run

```sh
COIN_SANDBOX_TEZOS='--node octez@<version> --indexer tzkt@<version>' pnpm coin:tester:tezos start
```

Requires coin-sandbox's server running (`deno task server` in its repository, port 8000;
`COIN_SANDBOX_URL` points elsewhere) and a Docker daemon. `COIN_SANDBOX_TEZOS` gives the node and
indexer versions: take them from the `tezos` entry of `COIN_SANDBOX_NETWORKS` in
`.github/workflows/test-coin-tester.yml`, the only place they are written. The Octez version decides
the protocol (coin-sandbox's `docker/tezos/README.md`). Each scenario asks for its own instance and
removes it at the end. Without `COIN_SANDBOX_REGISTRY`, the first `up` builds TzKT's `tzkt-sync`
image, a few minutes.

Ledger Live signs with a software signer (ed25519 for tz1, secp256k1 for tz2), not the device: this
proves the bridge and coin-tezos, not what the Tezos app accepts or shows.

## Coverage

Each scenario, tz1 (`44'/1729'/0'/0'`) and tz2 (`44'/1729'/0'`), plays the steps below in order.

| # | Step | Asserts |
| --- | --- | --- |
| before | Sync after the airdrop of 20 XTZ | balance is the airdrop; one `IN`, no other operation |
| 1 | Send 1 XTZ from the unrevealed account | a `REVEAL` is batched before the `OUT`; the balance drops by the value plus the reveal fee |
| 2 | Send 5 XTZ | `OUT`; the balance drops by the operation's value |
| 3 | Delegate to a sandbox baker | `DELEGATE` to the first baker of coin-sandbox's list |
| 4 | Undelegate | `UNDELEGATE`, the previous baker as recipient |
| 5 | Send max | `OUT`; at most 500 mutez left (`DUST_MARGIN_MUTEZ`) |
| after | Operation counts | 1 `IN`, 3 `OUT`, 1 `REVEAL`, 1 `DELEGATE`, 1 `UNDELEGATE` |

## Notes

- The account is funded by coin-sandbox's airdrop, which is a real operation on the chain: the first
  sync lists it as one `IN`.
- The sends go to another sandbox baker, an account that exists, so no allocation fee is burned.
- The module reads the bakers from coin-sandbox's server (`baker.url`), the chain from the node
  (`node.url`) and the account from TzKT (`explorer.url`).
- Each step waits until TzKT lists the operation, since the module syncs from TzKT, which follows the
  node a moment later.

## Layout

| File | Role |
| --- | --- |
| `src/sandbox.ts` | The sandbox instance, the sandbox bakers, the wait for TzKT to list an operation |
| `src/signer.ts` | Software tz1 and tz2 signers, with fresh keys per run |
| `src/fixtures.ts` | Currency, account factory |
| `src/helpers.ts` | `getBridges(signer)`: the generic coin framework bridges for `tezos` |
| `src/scenarii/tezos.ts` | The tz1 and tz2 scenarios |
| `src/scenarii.test.ts` | Runs the scenarios |

## Limitations

`stake`, `unstake` and `finalize_unstake` are not exercised.

When Shadownet moves to a newer protocol than mainnet's, the tester runs it only by hand:

1. coin-sandbox lists the Octez version that activates the new protocol (its `docker/tezos/README.md`,
   "To add an Octez version").
2. Run the scenarios against it: `COIN_SANDBOX_TEZOS='--node octez@<version> --indexer tzkt@<version>'`
   locally, or the workflow (`workflow_dispatch`, chain `tezos`) from a branch whose `tezos` flags name it.
3. Running both versions in every scheduled run needs a second matrix entry that reads its own variable:
   not built yet, since no testnet is ahead of mainnet.
