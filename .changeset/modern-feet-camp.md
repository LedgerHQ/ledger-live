---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Celo Custom-fees "Pay fees in" options now show a currency icon and held balance for native CELO and each allowlisted fee token, on desktop and mobile. The generic `FeeAssetOption` contract gains two optional fields (`currency`, `balance`); the UI formats the raw balance with the user's locale. Coins that don't set them render exactly as before.
