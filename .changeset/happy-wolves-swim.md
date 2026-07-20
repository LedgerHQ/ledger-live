---
"@ledgerhq/coin-evm": minor
---

Wire 0G (zero_gravity) delegate: add protocol encoder, stake fetcher (getDelegation + convertToTokens), and STAKING_CONFIG entry. Fix Blockscout adapter to derive methodId from input calldata when the API field is absent, so staking ops keep their DELEGATE type after confirmation.
