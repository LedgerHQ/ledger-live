---
"@domain/api-card-management": minor
---

Add `getWalletHistory` for `GET /v1/wallet/history`.

- One wallet at a time, newest first, ten to a page. A card has several linked, so reading them all means one call per wallet.
- `walletCurrency` is required for an internal wallet and checked before the request goes out, because the provider errors without it.
- `sign` is lowercase here and uppercase on a card transaction. The schema keeps the wire's own case rather than hiding the difference from whatever has to reconcile the two.
