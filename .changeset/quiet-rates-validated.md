---
"@domain/api-aggregated-assets": patch
"@domain/entity-interest-rate": patch
"@domain/entity-currency": patch
---

Validate the DADA response per item, dropping malformed entries instead of trusting the payload, and brand an interest rate's currencyId and fetchAt so an id or timestamp cannot be confused with a plain string
