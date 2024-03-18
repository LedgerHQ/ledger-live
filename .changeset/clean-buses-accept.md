---
"@ledgerhq/coin-evm": minor
---

Update `DEFAULT_NONCE` (-1) behaviour when converting a Ledger Live transaction to an `ethers` transaction, because using an invalid nonce (like a negative value here) will make `ethers` throw with some of its methods, like `serializeTransaction`
