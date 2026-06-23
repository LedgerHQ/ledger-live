---
"live-mobile": patch
---

Fix the Market filters drawer content spacing. The inner container added its own `paddingHorizontal: 16` on top of the drawer's built-in 16px padding, double-padding the content. The redundant padding is removed so the sorting and timeframe sections sit at the expected 16px left & right.
