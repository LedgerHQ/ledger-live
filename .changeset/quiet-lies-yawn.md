---
"@ledgerhq/coin-concordium": minor
"@ledgerhq/errors": minor
"@ledgerhq/live-signer-concordium": minor
"@ledgerhq/live-dmk-shared": minor
---

Forward the wallet-computed max fee (µCCD) to the Concordium device so it can be rendered on-screen during signing. `ConcordiumSigner.signTransaction` gains a required `maxFee: bigint` third argument; the bridge `signOperation` passes the value already computed via `estimateFees`. Bumps `@ledgerhq/device-signer-kit-concordium` to the version that supports the fee-display extension (Concordium app 5.6.0+); on older firmware the value is dropped at the wire boundary and signing falls back to the legacy display. Adds `ConcordiumInvalidMaxFeeError` for surfacing invalid-input errors from the underlying signer.
