---
"live-mobile": patch
---

Add unit tests covering the market banner filter tracking event (`change_sort_market_banner`): it fires with the correct `sort` for each of the four options and is not fired when reselecting the already active option.
