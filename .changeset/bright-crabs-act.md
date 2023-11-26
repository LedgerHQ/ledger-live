---
"@ledgerhq/coin-evm": patch
---

Updating the hashing algorithm from SHA256 to MurmurHashV3 for the `getSyncHash` method in order to drastically increase performances on a React Native environment.
