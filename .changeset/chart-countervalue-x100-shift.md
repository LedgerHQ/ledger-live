---
"ledger-live-desktop": minor
---

Fix the portfolio Analytics chart displaying countervalues inflated by x100. The chart data and variation text are already expressed in the fiat unit's smallest atom, but the formatter applied an extra magnitude shift. A dedicated `createSmallestUnitFiatLineChartValueFormatter` is now used for smallest-atom data, and the variation text is shifted down by the unit magnitude.
