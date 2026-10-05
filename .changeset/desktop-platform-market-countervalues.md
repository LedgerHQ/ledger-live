---
"ledger-live-desktop": minor
---

Read the countervalues provider and hooks, `useUsdToFiatRate` and `useGetCounterValueIdsPolling` from `@features/platform-market-countervalues` instead of `@ledgerhq/live-countervalues-react` and live-common, and drop the `@ledgerhq/live-countervalues-react` dependency. The app and the test wrapper now mount the platform provider in place of the old one.
