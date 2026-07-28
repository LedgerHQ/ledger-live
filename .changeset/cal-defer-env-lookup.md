---
"@ledgerhq/ledger-cal-service": patch
---

Defer CAL_SERVICE_URL env lookup to call site to avoid module-scope side effects.
