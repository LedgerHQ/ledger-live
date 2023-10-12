---
"@ledgerhq/coin-evm": minor
---

Ensure compatiblity with @ledgerhq/coin-framework change regarding `TokenAccounts` ids & update `preload` & `hydrate` method to use the `convertBEP20` method instead of the `convertERC20` method when dealing with the bsc chain. This last fix is technically useless as BEP20 = ERC20, it's only here in order to prevent breaking changes with the different backends at Ledger. As soon as those backends have the possibility of changing the "bsc/bep20/XYZ" token ids into "bsc/erc20/XYZ", this fix should be removed in order to avoid useless complexity.
