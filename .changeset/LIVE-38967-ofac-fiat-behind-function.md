---
"@domain/entity-currency-fiat": minor
"@domain/api-currency-fiat": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

The OFAC-sanctioned fiat list now has one owner, `@domain/entity-currency-fiat`, behind `isSanctionedFiatTicker(ticker)`. The package no longer exports `OFAC_FIAT_TICKERS`, and `@ledgerhq/live-common/currencies` no longer exports `OFAC_CURRENCIES`. Both apps and `@domain/api-currency-fiat` call the new function.
