---
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix: sell quotes now correctly shown when returning from a provider via "Back to quote". Previously, BuySellUI defaulted to buy mode because the stored flow name was not passed back during navigation. Desktop also removed a hardcoded `|| "buy"` fallback when saving the flow name to localStorage.
