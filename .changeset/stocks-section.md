---
"live-mobile": minor
---

Add the Portfolio Stocks section and wire it into `AssetsSections` behind the `assetDiscoverability` flag. When the user holds stocks it renders a vertical list (max 5, mirroring the Crypto/Stablecoins sections) with a "Show more" header that opens the Crypto screen filtered to stocks — extending `CryptoVariant` with `"stocks"` and the asset-list filter accordingly. When the user holds none it renders a horizontal 2-row discovery grid of the top stocks (MediaButton pills) with an "Explore All" header that opens the Market list filtered to stocks; tapping a pill opens that stock's market detail. The 2-row grid is extracted into a shared `StockPillRows` component reused by Global Search (removing the duplicated grid). Subheader spacing: the holdings list matches the other portfolio sections, the discovery grid uses s12.
