---
"@ledgerhq/wallet-pnl": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix PnL showing an up/down arrow for a near-zero unrealised return. PnL amounts are computed in the counter-value unit's smallest atom (e.g. cents), so a sub-cent residual like `-0.31` cents rendered as `$0.00` yet still drove a down arrow. The PnL return values are now rounded to the displayed precision (the nearest atom) in the view-models via the new `roundFiatAtoms` helper from `@ledgerhq/wallet-pnl`, so the amount and its trend indicator are derived from the same number — when the amount shows `0.00`, the trend is neutral (no ±/arrow) on both the asset detail and portfolio PnL cards.
