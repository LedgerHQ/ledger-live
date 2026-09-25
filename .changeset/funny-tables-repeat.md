---
"live-mobile": minor
---

Fix perps deposit quotes returning empty on mobile: read `SWAP_API_BASE` from `react-native-config` at store setup so the swap aggregator URL is resolved before the store captures it
