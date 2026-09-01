# @ledgerhq/coin-tester-zcash

> [!CAUTION]
> **Status: UNSTABLE** — depends on an unpublished @ledgerhq/zcash-utils build and on @ledgerhq/coin-zcash itself being UNSTABLE.

This package contains the deterministic testing infrastructure for Zcash in Ledger Live: transparent
(t→t), shielding (t→z), de-shielding (z→t) and shielded (z→z) sends against a local `zebra` (Regtest
consensus node) + `zaino` (shielded gRPC indexer) stack.

## Features

- Deterministic testing scenarios covering all 4 Zcash send flows
- Local signer delegating 100% of signing to `@ledgerhq/zcash-utils`'s test-only NAPI surface
  (`testDeriveKeys`/`testSignPczt`/`orchardAddressFromUfvk`) — no device, no hand-rolled crypto
- Integration with a local `zebra` + `zaino` regtest stack for chain state
- MSW bridges the wallet's Ledger-explorer HTTP calls to `zebra`'s own address-indexed JSON-RPC
  (`getaddressutxos`/`getaddresstxids`/`getrawtransaction`), so no separate explorer service is required

## Usage

Run the tests with `pnpm coin:tester:zcash test` from the repo root, or `pnpm start` from this
package's directory (both require Docker running locally).

## Development

The `@ledgerhq/zcash-utils` build this package depends on is not published yet. `pnpm link` corrupts
the root `package.json`/`pnpm-lock.yaml` in the pnpm version this repo pins, so link it manually
instead: symlink `node_modules/@ledgerhq/zcash-utils` to the local `ledger-zcash-utils` clone's root
in **both** this package's own `node_modules` and `@ledgerhq/coin-zcash`'s (each package resolves its
own dependency tree independently under pnpm), after running that clone's own NAPI build.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-zcash
- @ledgerhq/zcash-utils (via `pnpm link`)
