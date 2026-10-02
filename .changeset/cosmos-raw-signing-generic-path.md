---
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-cosmos": patch
---

Keep WalletConnect `cosmos_signAmino` working on the generic bridge: `BridgeApi.signRawOperation` lets a family replace the generic raw signing (craft, sign, combine) with its own. Cosmos registers its verbatim, detached-signature implementation there, the one its legacy bridge already uses. `account.getPublicKey` now returns the Cosmos account public key instead of the address legacy accounts keep in `xpub`.
