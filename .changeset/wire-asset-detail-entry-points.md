---
"live-mobile": minor
"ledger-live-desktop": patch
"@ledgerhq/asset-aggregation": minor
---

Wire mobile asset entry points (Market list, Market banner, Portfolio asset rows, Crypto/Stablecoin lists, Analytics distribution cards) to the new MVVM AssetDetail screen when shouldDisplayAggregatedAssets is true; fall back to the legacy MarketDetail / Accounts > Asset routes otherwise. Add a shared `resolveAssetMarketInputs` helper in `@ledgerhq/asset-aggregation` to derive `marketApiId` / `knownLedgerIds` / `knownMarketId` consistently across desktop and mobile, fixing the BNB-style ledger-id ≠ market-id mismatch that caused empty market data on the asset detail screen.
