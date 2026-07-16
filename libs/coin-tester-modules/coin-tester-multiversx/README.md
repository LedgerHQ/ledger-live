# @ledgerhq/coin-tester-multiversx

Deterministic coin tester for the MultiversX (`coin-multiversx`) bridge. It runs
the full bridge flow — sync, craft, sign, broadcast, account-state assertions —
against a local [MultiversX Chain Simulator](https://github.com/multiversx/mx-chain-simulator-go)
in Docker. No Ledger Live UI, no Speculos, no real funds, no external network.

## Run

```sh
pnpm coin:tester:multiversx start
```

Requires Docker. The coin module must be built first (`pnpm --filter coin-multiversx build`).

## How it works

- **Local node**: `docker-compose.yml` runs the chain simulator with `--num-of-shards 1`,
  which exposes the standard gateway/proxy API plus `/simulator/*` control endpoints. Blocks
  are never produced on a timer — the tester drives them via `POST /simulator/generate-blocks/:n`,
  so every run is identical. A single shard keeps every address in shard 0, so transfers are
  intra-shard and settle in one block (cross-shard settlement timing would otherwise be flaky).
- **Funding**: accounts are credited directly via `POST /simulator/set-state` (no faucet).
- **Indexer (`indexer.ts`)**: `coin-multiversx` talks to the api.multiversx.com-style
  *aggregator* API, but the simulator only serves the *gateway/proxy* API. MSW intercepts
  the aggregator hosts and translates each call onto the simulator: balance/nonce/tokens/
  network-config are proxied live; transaction history (which the gateway can't serve by
  address) is tracked in-memory as the tester broadcasts, then served back in aggregator
  shape — the same pattern as `coin-tester-evm` and `coin-tester-tezos`.
- **Signer (`signer.ts`)**: local ed25519 key derived from a generated mnemonic at
  `m/44'/508'/0'/0'/0'`. Signs `TransactionComputer.computeBytesForVerifying` (keccak256 of
  the serialized tx, because the bridge sets the hash-sign option), matching the device and
  the network byte-for-byte.

## Scope and strategy

- **Strategies**: both `legacy` and `generic-adapter` are tested (via `describe.each`), like
  `coin-tester-solana`. The legacy `@ledgerhq/coin-multiversx` bridge is adapted to
  `GenericTransaction` in `helpers.ts`; the generic-adapter path drives the Alpaca `createApi`
  through the generic coin framework. Both share one scenario and one local signer.
- **Covered**:
  - Both strategies: send native EGLD, send-max EGLD, send ESDT, send-all ESDT (tokens). No staking.
- **ESDT funding**: `setup()` advances past the ESDT enable epoch, issues a fungible token from a
  throwaway account (to register it in the ESDT system contract), then credits the scenario account
  via `set-state pairs` (the `ELRONDesdt<id>` trie key with an `ESDigest` protobuf value) — so the
  account gets the token with no extra operation/EGLD change. See `esdt.ts`.

### Required live-common wiring for the generic-adapter strategy

The generic coin framework resolves the coin's Alpaca API + bridge helpers from a registry.
The tester passes a custom local signer, so `loadSigner` is not needed, but these were added:

- `libs/ledger-live-common/src/families/multiversx/coinModuleApi.ts` — `createLocalMultiversXApi`
  wrapping `@ledgerhq/coin-multiversx/api`'s `createApi`.
- `libs/ledger-live-common/src/families/multiversx/bridge/api.ts` — `BridgeApi`
  (`computeIntentType`, `getAssetFromToken`, `getTokenFromAsset` for ESDT).
- `libs/ledger-live-common/src/coin-modules/loaders.ts` — added `loadLocalApi`, `loadBridgeApi`,
  `loadValidateAddress` to the `multiversx` entry.

This does NOT flip `genericCoinFrameworkFamilies.json` (`multiversx` stays on the legacy bridge in
the real app); the tester calls `getCoinFrameworkAccountBridge` directly, as Solana's tester does.

## Coin-module change this surfaced

The Alpaca `createApi.craftTransaction` originally hardcoded `chainID = "1"` (mainnet), while the
legacy bridge fetches the chain id from the network. On any non-mainnet network (devnet/testnet/
simulator) the Alpaca path would therefore craft invalid transactions. Fixed in
`libs/coin-modules/coin-multiversx`: `craftTransaction` now fetches the chain id from
`getNetworkConfig` (falling back to the `CHAIN_ID` constant), which both makes the generic-adapter
strategy pass here and improves legacy↔alpaca parity. Rebuild `coin-multiversx` after pulling.
