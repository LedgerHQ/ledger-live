---
"live-mobile": minor
---

Wire the market banner ranking to its data source: `trending`/`gainers` show the top positive price-change performers, `losers` the top negative ones, and `favorites` the user's starred assets. When the active ranking is `favorites` and the user removes their last favourite, the banner falls back to `trending` and resets the persisted ranking.
