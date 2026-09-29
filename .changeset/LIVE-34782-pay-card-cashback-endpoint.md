---
"@domain/api-card-management": minor
"@features/flow-pay-card-wallets": minor
"@features/flow-pay-card-details": minor
"@features/platform-pay-analytics": minor
"@support/msw-features-flow-pay-card": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Read the card cashback banner from `GET /v1/card/cashback`

- Add `getCardCashback` endpoint, resolving the asset's `currency`/`network` pair (both nullable) to its `ledgerId`
- Remove `getRewardWallet` (`GET /v1/wallet/reward`), its schema, types, mock and handlers
- `useCardCashback` replaces `useCardRewardWallet` in the reward banner
- Banner subtitle now shows the rate and ticker: "Total cashback · 1% in BTC"
- `cardRewardsAvailable` / `cardRewardCurrency` analytics now read the cashback (amount > 0)
