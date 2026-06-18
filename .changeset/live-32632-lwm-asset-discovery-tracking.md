---
"live-mobile": patch
---

Update asset discovery analytics on mobile: add `source` (previous page) to the Global Search `asset_clicked` event, enrich the `Page Market` event with `sortVolume`/`sortMarketCap`/`sortChange`/`timeframe`/`category`, add the selected `category` to the market asset `button_clicked` event, and reshape `sort_market_list` to report each sort column independently.
