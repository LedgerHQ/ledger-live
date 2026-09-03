---
"@ledgerhq/coin-solana": patch
"@ledgerhq/live-common": patch
---

Fix Solana account synchronization failing when the RPC provider deprioritizes stake
account discovery. Stake accounts are now enumerated with the paginated
getProgramAccountsV2, falling back to getProgramAccounts on endpoints that do not
implement it (devnet, testnet and the local test validator run vanilla agave).
