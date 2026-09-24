---
"@domain/api-card-management": minor
---

Rewrite the order the card's linked wallets are charged in.

- `updateCardWalletPriorities` puts the whole order to `/v1/wallet/internal/card_linked/priority`, each wallet named by its `addressId`.
- Duplicate priorities and a repeated wallet are rejected before the request is sent, as is an empty order.
- Only a written order invalidates the `CardLinkedWallets` tag: neither an error nor a `success: false` answer changed the order.
