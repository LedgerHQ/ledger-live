---
"ledger-live-desktop": minor
"@ledgerhq/asset-aggregation": minor
---

Fix MarketBanner/Market list navigation so clicking Arbitrum opens the ARB asset detail instead of the Ethereum one, by passing the market ledger ids in the navigation state and preventing a bare market id from colliding with a same-named chain id