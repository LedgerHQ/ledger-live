---
"@ledgerhq/coin-solana": patch
---

Read the owner's token accounts once per sync instead of three times: `getBalance`, the token account shapes and `listOperations` now share each token program's lookup for a short window, bounded in size and cleared on broadcast. `listOperations` caps its walk at the slot of that lookup, so a token account created after it cannot be skipped: newer signatures are left to the next sync, and the cap travels in the cursor (older cursors still read, without a cap). The signature sources of `listOperations` follow `token2022Enabled`, as `getBalance` does.
