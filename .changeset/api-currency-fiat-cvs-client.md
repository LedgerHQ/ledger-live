---
"@domain/api-currency-fiat": minor
"@domain/entity-currency-fiat": minor
---

Add `@domain/api-currency-fiat`, the RTK Query client for fiat currencies backed by the Ledger
Countervalues Service (CVS): `currencyFiatApi` (`getSupportedFiats`), the Zod response schema and the
tickers→`FiatCurrency[]` resolver (`resolveSupportedFiats`: OFAC filtering, registry-based resolution
and de-duplication). The CVS URL is injected via the store's thunk `extraArgument` (`cvsApiExtra`),
so the package owns no env/config dependency. Typed on `@domain/entity-currency-fiat`; no
`@ledgerhq/*` dependency. Not yet wired into the apps.

`@domain/entity-currency-fiat` gains a by-ticker lookup (`FIAT_CURRENCIES_BY_TICKER` +
`getFiatCurrencyByTicker`), since the CVS returns ISO 4217 tickers while the registry is keyed by id.
