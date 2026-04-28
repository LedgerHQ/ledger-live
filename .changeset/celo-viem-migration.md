---
"@ledgerhq/coin-celo": minor
"@ledgerhq/hw-app-celo": minor
"@ledgerhq/live-signer-celo": minor
---

Remove all `@celo/*` runtime dependencies and replace with `viem` SDK; drop `rlpEncodedTxForLedger` from the Celo signer interface in favour of viem/celo CIP-64 transaction serialization
