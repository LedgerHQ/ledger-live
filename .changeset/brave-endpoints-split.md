---
"@domain/api-aggregated-assets": patch
---

Split the DADA api into per-use-case endpoint modules and route every request through RTK's injected base query, so aborts, shared headers and HTTP error statuses are preserved
