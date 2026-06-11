---
"ledger-live-desktop": minor
---

Add dynamic trending categories to the Market category bar. Trending categories from the `/v3/categories/trending` backend endpoint are appended after the built-in categories (All / Stocks / Favorites), deduplicated against built-ins, and filter the market list when selected. The category bar now sizes each chip to its label and scrolls horizontally (scrollbar hidden) when the chips overflow.
