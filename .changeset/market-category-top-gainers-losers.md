---
"@ledgerhq/live-common": patch
---

fix(market): stop excluding most coins when combining a trending category with the top gainers/losers filter. The `top=100` restriction is no longer sent alongside a `categories` filter, since the backend intersects both sets and category coins rarely rank in the global top 100.
