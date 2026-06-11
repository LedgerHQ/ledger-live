---
"live-mobile": minor
---

Build the market banner filter selection drawer: a Lumen `OptionList` bottom sheet with the four filter options (Trending, Gainers, Losers, Favorites). The current filter is pre-selected, picking an option dispatches `setMarketBannerRanking`, closes the drawer and fires the `change_sort_market_banner` event. The Favorites row is disabled with a "No favorite yet" description when the user has no starred assets.
