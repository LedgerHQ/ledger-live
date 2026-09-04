---
"@features/flow-pay-card-wallets": minor
"@devtools/pay-card": minor
"@devtools/bindings": minor
"live-mobile": patch
---

Price a card-linked wallet through its Ledger currency.

- `ResolveWalletCounterValue` is keyed on the wallet's `ledgerId` instead of the provider's ticker: a ticker does not say which chain's token it is, and the rates are keyed by Ledger id.
- An asset the catalog does not cover is never sent to the rates at all, and reads as unpriced rather than as zero.
- The devtool shows each joined wallet's counter value, and the host passes the resolver in.
