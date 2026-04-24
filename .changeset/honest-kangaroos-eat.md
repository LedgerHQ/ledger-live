---
"live-mobile": patch
---

Plumb `shouldDisplayAggregatedAssets` into mobile distribution call sites (Portfolio tabs, Assets list, Allocation charts, AnalyticsMain, DetailedAllocation, legacy Analytics/Allocation) so the wallet4.0 asset-aggregation feature flag actually groups assets on mobile, matching desktop behavior.
