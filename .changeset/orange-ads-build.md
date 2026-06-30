---
"ledger-live-desktop": minor
---

Remove the temporary Wallet 4.0 `graphRework` and `balanceRefreshRework` feature-flag gating on the portfolio. The reworked balance graph, balance refresh animation and two-decimal value-change percentage are now always on, and the related `shouldDisplayGraphRework` / `shouldDisplayBalanceRefreshRework` props and config reads have been dropped.
