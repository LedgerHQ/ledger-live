---
"@ledgerhq/coin-near": patch
---

Guard NEAR gas price parsing against empty/degraded indexer responses. When the NEARBLOCKS indexer `/v1/stats` endpoint returns no stats, `getGasPrice` now throws a clear `NearGasPriceNotLoaded` error instead of an opaque `Cannot read properties of null (reading '0')`.
