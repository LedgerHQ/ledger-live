---
"live-mobile": minor
---

Import the countervalues provider and hooks from `@features/platform-market-countervalues` instead of `@ledgerhq/live-countervalues-react`, and `useUsdToFiatRate` and `useGetCounterValueIdsPolling` from it instead of live-common. The app and the test renderer mount the platform provider. Mobile no longer depends on `@ledgerhq/live-countervalues-react`. Specifier change only, no behaviour change.
