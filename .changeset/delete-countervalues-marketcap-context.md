---
"@ledgerhq/live-countervalues-react": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Remove `CountervaluesMarketcapProvider` context and all related bridge/Redux plumbing. Market-cap IDs are now supplied via `useGetCounterValueIdsSortedByMarketCapQuery`, the RTK Query endpoint.
