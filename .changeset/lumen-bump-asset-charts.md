---
"ledger-live-desktop": minor
"live-mobile": minor
---

Bump Lumen (design-core 0.1.17 / ui-react 0.1.41 / ui-react-visualization 0.1.20 / ui-rnative 0.1.42 / ui-rnative-visualization 0.1.19) and adapt the asset-detail price chart to its new four-state rendering. The chart now drives its loading and empty states through the Lumen `LineChart` `loading`/`emptyLabel` props instead of bespoke skeleton/error components, derives loading from the chart query's fetching state so changing the timeframe shows a loading state (not "No data"), and keeps the previous timeframe's line while the next one loads — scoped to the current asset so switching to an asset with no data shows the empty state rather than the previous asset's graph.
