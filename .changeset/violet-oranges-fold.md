---
"ledger-live-desktop": minor
"@ledgerhq/live-common": patch
---

Wire AssetDetail chart section to the Market `/v3/markets/chart` endpoint, share the selected range between the chart and the market price section, and percent-encode the asset id in the chart URL so ids containing reserved characters (e.g. `arbitrum/erc20/...`) resolve correctly.
