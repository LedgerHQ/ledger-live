---
"@ledgerhq/coin-tron": minor
---

Add Tronify `listFeeOptions` fee-option discovery (ADR-050 Option 3).

`listFeeOptions(intent)` is the lightweight first step of the two-call fee flow: it returns availability metadata only (no amounts). It advertises `[tronify, standard]` only when the intent is a TRC-20 transfer, a recipient is set, the Tronify provider is activated in remote coin-config (`energyRent` present), and the standard path would actually burn TRX; it returns `[standard]` otherwise. It never throws — any failure degrades to the standard-only list so the default path always works. The priced quote per option is fetched later by `estimateFees(intent, "tronify")`.
