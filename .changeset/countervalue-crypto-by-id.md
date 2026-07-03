---
"@ledgerhq/live-common": patch
"live-mobile": patch
"ledger-live-desktop": patch
---

Replace deprecated findCryptoCurrencyByTicker with the id-anchored findCountervalueCryptoCurrencyByTicker (and the new countervalueCryptoCurrencies set) in the counter-value selector and Market number formatting, on both desktop and mobile, so crypto countervalue resolution is no longer ambiguous.
