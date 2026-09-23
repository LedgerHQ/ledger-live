---
"@features/flow-pay-card-details": minor
"@features/flow-pay-card-wallets": minor
"@features/flow-pay-card-assets": minor
"@features/flow-pay-card": minor
"@domain/api-card-management": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Show a counter-value on the card rewards banner.

- The reward wallet now carries the currency it is denominated in, like a linked wallet does.
- The banner prices it with the host's rates and leads with the counter-value.
- The amount is formatted as a token, not as fiat.
- A reward nothing can price shows the asset amount alone.
- `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.
