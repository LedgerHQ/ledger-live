---
"@ledgerhq/live-cli": patch
"@ledgerhq/live-common": patch
---

Fix Concordium e2e app.json generation resolving to the mainnet currency instead of testnet, by giving the testnet its own Speculos app identity (mirroring Ethereum Sepolia).
