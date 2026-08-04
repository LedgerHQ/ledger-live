---
"@ledgerhq/coin-solana": patch
---

Fix missing token operations in Solana history when a swap/transfer is queried by the token-account (ATA) address (LIVE-35047). `listOperations` matched token balance changes only by Solana's `owner` field (the wallet), so querying by a token sub-account's own address — as coin-service/Ledger Live does — returned no token operations, making e.g. the USDC leg of a Jupiter swap invisible. Token balances are now also matched by their token-account address, and the resulting operation's `assetOwner`/senders/recipients resolve to the wallet owner regardless of which address was queried.
