---
"@ledgerhq/asset-detail": minor
"ledger-live-desktop": patch
---

Introduce `@ledgerhq/asset-detail` shared lib with the `useAssetMarketData` hook, `AssetDetailMarketInfo` / `AssetMarketData` types, and `resolveAssetDetailMarketInfo` utils. The desktop Asset Detail feature now consumes the shared module instead of maintaining its own implementation, so mobile can plug in next without re-implementing the fetching strategy.
