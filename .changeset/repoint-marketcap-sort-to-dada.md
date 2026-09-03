---
"@ledgerhq/ledger-live-common": minor
---

Replace CVS-backed marketcap sort helpers with DADA-backed equivalents.

`currenciesByMarketcap` (Promise-based) and `fetchMarketcapIds` are removed; callers now use either `useCurrenciesByMarketcap` (React hook, reads from the Redux DADA cache) or `sortCurrenciesByDada` (async, for non-React contexts). `sortCurrenciesByIds` is unchanged.
