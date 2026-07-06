# live-signer-celo

`@ledgerhq/live-signer-celo` is the hardware-wallet signer for the Celo blockchain. It wraps the Celo Ledger app's APDU protocol and exposes a typed signer interface consumed by the Celo coin module.

## What it does

- Communicates with the Celo app on the Ledger device over the transport layer to sign transactions and retrieve public keys.
- Exports a `LegacySignerCelo` class for backwards-compatible signing flows from earlier Celo app versions.

## Key exports / concepts

- Default signer implementing the `CeloSigner` interface expected by `@ledgerhq/coin-celo`.
- `LegacySignerCelo` — handles older Celo app firmware where the signing command differs.

## Usage context

Consumed exclusively by the Celo coin module. Follows the same pattern as every other `libs/live-signer-*` package: one signer per coin family, injected at runtime by the coin module loader.
