---
"@features/platform-market-countervalues": minor
"@ledgerhq/live-common": minor
---

`@features/platform-market-countervalues` is now the only countervalues React glue in the monorepo.

- The platform package no longer exports `CountervaluesContext`. It was public only so the old React package could share one context during the migration. Read countervalues through the package hooks, under a `CountervaluesProvider`.
- live-common no longer has `counterValues/*`: its own `useUsdToFiatRate` and `useGetCounterValueIdsPolling` are removed. Import both from `@features/platform-market-countervalues`.
