---
"@domain/entity-market-countervalues": minor
"@features/platform-market-countervalues": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`pending`, `error`, `isPolling`, `triggerLoad`) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; action type strings, persistence and the saved data are unchanged. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.
