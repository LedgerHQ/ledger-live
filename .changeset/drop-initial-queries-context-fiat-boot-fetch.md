---
"live-mobile": minor
"ledger-live-desktop": minor
---

Drop boot fiat fetch and `InitialQueriesContext`: `supportedCounterValues` is now a derived selector backed by the `supportedFiats` slice. Mobile gains a read-time OFAC guard on `counterValueCurrencyLocalSelector`; desktop removes its boot-time `getSupportedFiats.initiate` dispatch. Both apps now lazy-load the CVS query from the two picker screens.
