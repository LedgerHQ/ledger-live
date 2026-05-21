---
"live-mobile": patch
---

Fix Android crash on clear cache flow. Dispatching `wipeCountervalues` inside `useCleanCache` caused every mounted `CounterValue` consumer to re-render against the wiped state in a separate React commit from the subsequent `reboot()`; under Fabric this produced an `IllegalStateException: The specified child already has a parent`. Wipe is now dispatched from the reboot middleware in the same synchronous tick as the reboot action so React batches both updates and the `RebootProvider` key change unmounts the subtree before any countervalue consumer re-renders.
