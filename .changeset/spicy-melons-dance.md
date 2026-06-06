---
"@ledgerhq/coin-concordium": minor
"@ledgerhq/live-signer-concordium": minor
"@ledgerhq/errors": minor
---

Add max-fee display for Concordium app 5.6.0+. `ConcordiumSigner.signTransaction` takes a required `maxFee: bigint` (µCCD) forwarded to the device for on-screen rendering. New `ConcordiumInvalidMaxFeeError` typed error for invalid input.
