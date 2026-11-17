---
"@ledgerhq/coin-solana": patch
---

Read the owner's token accounts once per sync instead of six times: `getBalance`, the token account shapes and `listOperations` now share each token program's lookup for a short window, cleared on broadcast. The signature sources of `listOperations` follow `token2022Enabled`, as `getBalance` does.
