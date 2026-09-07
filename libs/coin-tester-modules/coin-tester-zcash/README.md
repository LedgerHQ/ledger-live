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

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-zcash
- @ledgerhq/zcash-utils
