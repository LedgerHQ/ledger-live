# @ledgerhq/coin-tester-zcash

> [!CAUTION]
> **Status: UNSTABLE** — depends on @ledgerhq/coin-zcash itself being UNSTABLE.

This package contains the deterministic testing infrastructure for Zcash in Ledger Live: transparent
(t→t), shielding (t→z), de-shielding (z→t) and shielded (z→z) sends against a local `zebra` (Regtest
consensus node) + `zaino` (shielded gRPC indexer) stack.

## Features

- Deterministic testing scenarios covering all 4 Zcash send flows
- Local signer delegating all Orchard/Ironwood signing to `@ledgerhq/zcash-utils`'s test-only NAPI
  surface (`testDeriveKeys`/`testSignPczt`/`orchardAddressFromUfvk`) — no device required. Only the
  transparent BIP32 derivation and P2PKH address encoding are implemented locally (`src/signer.ts`)
- Integration with a local `zebra` + `zaino` regtest stack for chain state
- MSW bridges the wallet's Ledger-explorer HTTP calls to `zebra`'s own address-indexed JSON-RPC
  (`getaddressutxos`/`getaddresstxids`/`getrawtransaction`), so no separate explorer service is required

## Usage

Run the tests with `pnpm coin:tester:zcash test` from the repo root, or `pnpm start` from this
package's directory (both require Docker running locally).

## NU7 activation test

`src/nu7Activation.test.ts` runs its own zebra + zaino stack with NU7 scheduled at a low regtest
height, and covers a transparent send before, across and after the activation:

- before it, the builder caps the expiry one block below NU7 and signs against the previous
  consensus branch id;
- when the capped expiry would leave fewer than 8 blocks of validity, the builder refuses with
  "expiry too close to activation" (the exact boundary is asserted on both sides);
- zaino keeps following zebra's tip past the activation block;
- after it, the branch id is NU7's and the default expiry delta is 120 blocks (ZIP 218).

Run it alone with `pnpm jest --runTestsByPath src/nu7Activation.test.ts --runInBand` from this
package's directory. It shares host ports with the existing scenario, so the two never run in
parallel (`pnpm start` runs them in sequence). The zebra and zaino versions in
`src/docker/docker-compose.yml` are the ones Ledger runs in production; the first zaino build
compiles it from source and is slow.

## ZIP 218 block-count constants

ZIP 218 (Draft) cuts the block target spacing from 75 to 25 seconds at NU7, a factor of 3. Its
"Block-count-based constants", "Averaging window", "Halving interval and block subsidy",
"Default expiry delta" and "Anchor selection depth" sections say which block counts follow.

Scales with the 3x block rate:

| Constant                         | Before NU7 | From NU7  |
| -------------------------------- | ---------- | --------- |
| `MIN_BLOCKS_TO_KEEP`             | 288        | 864       |
| `MAX_BLOCKS_IN_TRANSIT_PER_PEER` | 16         | 48        |
| `BLOCK_DOWNLOAD_WINDOW`          | 1024       | 3072      |
| `MAX_REORG_LENGTH`               | 99         | 600 (x6)  |
| `PostNU7PoWAveragingWindow`       | 17         | 102       |
| Halving interval                 | 1,680,000  | 5,040,000 |
| Default transaction expiry delta | 40         | 120       |

The default expiry delta is the only one a crafted transaction observes, and the NU7 activation
test asserts it.

Does not move:

| Constant                                       | Value |
| ---------------------------------------------- | ----- |
| `COINBASE_MATURITY`                            | 100   |
| `TX_EXPIRING_SOON_THRESHOLD`                   | 3     |
| `NETWORK_UPGRADE_PEER_PREFERENCE_BLOCK_PERIOD` | 1728  |
| Anchor selection depth (ZIP 315)               | 3     |

ZIP 218's `MAX_REORG_LENGTH` has no literal counterpart in zebra, whose constant is
`MAX_BLOCK_REORG_HEIGHT = 1000` (`zebra-chain`, `parameters/constants.rs`, v7.0.0).

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-zcash
- @ledgerhq/zcash-utils
