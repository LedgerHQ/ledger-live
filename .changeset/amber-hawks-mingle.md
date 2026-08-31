---
"@ledgerhq/coin-internet_computer": patch
---

Stop an Internet Computer stake or top-up appearing more than once in the operation history. Reclassifying a transfer rewrites its operation id, so the sync merge added the retyped operation beside the stale one rather than replacing it; the superseded copies are now dropped, including on accounts that already hold them
