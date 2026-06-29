---
"@ledgerhq/coin-cosmos": minor
---

Implement `signRawOperation` for Cosmos: sign an externally-built amino `StdSignDoc` (e.g. from WalletConnect `cosmos_signAmino`) verbatim and return the detached 64-byte secp256k1 signature, without broadcasting. Previously a throwing stub.
