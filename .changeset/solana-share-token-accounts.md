---
"@ledgerhq/coin-solana": patch
---

Read the owner's token accounts twice per sync instead of three times: `getBalance` and the token account shapes now share each token program's lookup for a short window, bounded in size and cleared on broadcast. `listOperations` reads its signature sources fresh, and shares that read. The signature sources of `listOperations` follow `token2022Enabled`, as `getBalance` does.
