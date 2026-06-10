---
"@ledgerhq/cryptoassets": patch
"@ledgerhq/live-common": patch
"@ledgerhq/asset-aggregation": patch
---

Remove client-side token id/data remapping now reconciled on the backend (LIVE-22557 MultiversX, LIVE-22558 Stellar, LIVE-22561 TON Jetton). Drops the `legacyIdToApiId` helper and the related `convertApiToken` patches; ids are now consumed directly from CAL/DaDa. Cardano (LIVE-22559) and Sui (LIVE-22560) reconciliation are unchanged.
