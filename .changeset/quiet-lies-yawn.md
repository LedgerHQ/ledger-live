---
"@ledgerhq/coin-concordium": minor
"@ledgerhq/errors": minor
"@ledgerhq/live-signer-concordium": minor
"@ledgerhq/live-dmk-shared": patch
"@ledgerhq/live-signer-evm": patch
"@ledgerhq/live-signer-solana": patch
---

Add max-fee display for Concordium app 5.6.0+. `ConcordiumSigner.signTransaction` takes a required `maxFee: bigint` (µCCD) forwarded to the device for on-screen rendering. New `ConcordiumInvalidMaxFeeError` typed error for invalid input.

Bumps `@ledgerhq/context-module` to `2.0.0`, which now requires `setChain` before `ContextModuleBuilder.build()`. `live-signer-evm`, `live-signer-solana`, and `live-dmk-shared` set their chain explicitly to satisfy the new contract.
