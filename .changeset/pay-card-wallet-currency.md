---
"@features/platform-currencies": minor
"@features/flow-pay-card-wallets": minor
"@domain/entity-card-asset-mapping": minor
"@devtools/pay-card": minor
"@devtools/bindings": minor
"live-mobile": patch
---

Carry each card wallet's Ledger currency, so the app can price it.

- `useCurrenciesByIds` resolves a list of Ledger ids to currencies: coins from the crypto registry, tokens from CAL. The lookups are dispatched rather than hooked, so the list can be any length.
- A card wallet now carries `ledgerCurrency` instead of a counter value. Converting needs the app's rates, so it happens in platform code.
- `BAANX_LEDGER_CURRENCY_IDS` lists every Ledger id the card catalog resolves to.
- The Pay card devtool shows `ledgerCurrencyId` per joined wallet.
