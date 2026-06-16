---
"live-mobile": patch
---

Fix the Market Banner Favorites filter erroring on mobile. The favorites request sent an invalid `pageSize` to the market endpoint (the tile count `× 2`, not one of the supported 1/5/20/50 values), which returned an error. Favorites now request a valid page size and, like desktop, show starred coins even when not buyable/swappable.
