---
"ledger-live-desktop": minor
---

Add a neutral PnL trend display when the unrealised return is exactly zero. The card now shows a disabled (greyed) up arrow instead of a green one for zero balances. Internally, the trend resolution is consolidated into a single `getTrendIcon` helper in the PnL builder layer, and the `PnLCard` View now receives a precomputed `trendIcon` prop, keeping it fully presentational.
