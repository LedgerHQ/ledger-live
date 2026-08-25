---
"live-mobile": minor
"@ledgerhq/live-e2e-shared": minor
"ledger-live-mobile-e2e-tests": minor
---

Assert the mobile Buy/Sell handoff instead of the partner's checkout page, matching what
`e2e/desktop` already does. The app records the `WebPTXPlayer` handoff URL in a
`Config.DETOX`-guarded store and exposes it over the e2e bridge as `getPtxHandoff`, so the
specs verify the provider and query parameters without ever loading Transak's or MoonPay's
site — removing a dependency on a third party's uptime, and the ~70s per test spent waiting
on it. Parsing lives in `libs/live-e2e-shared/src/buySellHandoff.ts` and handles the
double-encoded URL that made `new URL()` throw, plus provider aliases such as Mercuryo's
`mrcr`. Also fixes the sell flow asserting a minimum amount the flow never types, since it
taps the 75% button, and makes the "Buy and sell query parameters" test actually assert
query parameters.
