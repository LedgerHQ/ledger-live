---
"ledger-live-desktop": patch
---

Fix portfolio realised/unrealised return on Desktop differing from Mobile for the same synced accounts. The portfolio PnL view model passed an already-flattened accounts list to `computePortfolioPnL`, which flattens internally, double-counting token sub-accounts and inflating the returns. It now passes the top-level (non-flattened) accounts, matching Mobile.
