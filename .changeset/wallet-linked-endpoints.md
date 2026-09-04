---
"@domain/api-card-management": minor
---

Add the custodial wallet queries the card balance is built from:

- `getInternalWallets` for `GET /v1/wallet/internal` — the only endpoint carrying balances, kept as decimal strings so the provider's precision survives.
- `getCardLinkedWallets` for `GET /v1/wallet/internal/card_linked` — the wallets funding the card, with the priority Baanx charges them in.

Both schemas are narrow: the internal wallet drops `addressId` and the constant `type`, and neither endpoint is given a cache tag until the link/unlink mutations that would invalidate it exist.

`addressMemo` accepts an explicit `null`, which is what the provider sends for a wallet with no memo. Requiring a string or an absent key would have failed that wallet, and with it the whole array.
