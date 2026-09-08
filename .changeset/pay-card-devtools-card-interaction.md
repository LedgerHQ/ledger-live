---
"@devtools/pay-card": minor
"@devtools/bindings": minor
"@domain/api-card-management": minor
---

Add a "Card interaction" screen to the Card / Pay devtool.

- Calls a signed-in cardholder's endpoints on demand and prints what they answer, so the data can be checked before any screen renders it.
- First probe: card status. Probes are a list, so further endpoints are one entry each.
- Exports `useLazyGetCardStatusQuery`, which a button-triggered fetch needs.
- Native only for now.
