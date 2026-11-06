---
"@ledgerhq/coin-solana": patch
"ledger-live-desktop": patch
---

fix(coin-solana): sign a partner-built transaction whose fees another account pays (Jupiter gasless and RFQ swaps): crafting accepts any sender among the transaction's required signers instead of the fee payer only, crafting and fee estimation keep the partner's blockhash when another signer still has to sign (and crafting reports a blockhash's expiry only when it fetched that blockhash), and combine places the device signature in the sender's slot rather than at index 0
