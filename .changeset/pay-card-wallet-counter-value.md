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
- The card's assets are registered as counter-value tracking pairs: the app polls rates for what the user holds, and a card wallet is rarely one of those.
- The three Balance sections are tinted apart, so the two responses and the join are easy to read against each other.
