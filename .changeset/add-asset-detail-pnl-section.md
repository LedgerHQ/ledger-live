---
"live-mobile": minor
"@ledgerhq/wallet-pnl": minor
---

Add PnL section to the mobile Asset Detail screen (Unrealised return + Average entry price cards, opens a detail drawer). Extracts a shared `usePnlViewModelBase` + builders under `mvvm/features/Pnl` so the Analytics (portfolio) and Asset Detail (asset) consumers share the same logic, and exposes `trendFromSign` / `PnlTrend` from `@ledgerhq/wallet-pnl` so mobile and desktop derive trends from the same primitive.
