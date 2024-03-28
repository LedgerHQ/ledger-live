---
"@ledgerhq/coin-evm": minor
---

Update `getSyncHash` method to use new hash files provided by token importers instead of manually serializing each token. This greatly improve performances of that method.
