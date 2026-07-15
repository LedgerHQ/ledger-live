---
"@domain/entity-currency-fiat": minor
"@domain/api-currency-fiat": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add supported-fiats RTK slice to @domain/entity-currency-fiat; wire currencyFiatApi onQueryStarted to dispatch it; register currencyFiatApi in desktop and mobile stores with cvsApiExtra extraArgument composition.
