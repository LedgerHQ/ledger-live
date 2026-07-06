---
"@ledgerhq/coin-cosmos": minor
"@ledgerhq/live-common": minor
---

Persist the per-account compressed secp256k1 public key (hex) in `cosmosResources`, captured from the device at scan, and expose it via the Wallet API `account.getPublicKey` resolver for the cosmos family. Enables WalletConnect `cosmos_getAccounts`. Accounts synced before this change return no public key until re-synced.
