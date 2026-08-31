---
"@ledgerhq/coin-internet_computer": patch
---

Report the real number of operations an Internet Computer account holds. Each sync added the page it had just fetched to the stored count, and the index canister is queried from the current ledger tip every time, so the same newest page was counted again and again and the figure grew without bound
