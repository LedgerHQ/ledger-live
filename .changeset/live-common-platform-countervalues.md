---
"@ledgerhq/live-common": minor
"@ledgerhq/asset-detail": minor
---

Read the countervalues hooks from `@features/platform-market-countervalues`. In live-common, `useSyncSources`, the portfolio hooks and `useAssetDistribution` take `useCountervaluesPolling` and `useCountervaluesState` from it instead of `@ledgerhq/live-countervalues-react`, and `useAssetChartDataInCounterValue` and the right market trend module take its `useUsdToFiatRate` instead of live-common's own. asset-detail's `useAssetMarketData` does the same. live-common drops its `@ledgerhq/live-countervalues-react` dependency and keeps exporting `counterValues/*` while the apps still import it. Specifier change only, no behaviour change.
