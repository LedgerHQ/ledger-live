---
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/live-common": patch
"@ledgerhq/coin-cosmos": patch
---

Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components
