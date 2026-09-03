---
"@ledgerhq/coin-zcash": patch
---

Bound transparent-input and Ironwood-note selection to the device's per-PCZT ceilings on both pools, so a send from an account holding more UTXOs or notes than the device can sign in one PCZT no longer produces an unsignable transaction. A send whose full balance covers the requested amount but whose device-safe selection does not now reports a distinct, actionable error instead of a plain insufficient-balance one.
