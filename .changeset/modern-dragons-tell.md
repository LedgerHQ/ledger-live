---
"@ledgerhq/ledger-wallet-framework": patch
"@ledgerhq/live-common": patch
---

Change BridgeApi.getChainSpecificRules from a function returning ChainSpecificRules to a plain ChainSpecificRules field, and update Stellar accordingly (LIVE-28622)
