---
"@domain/api-card-management": minor
---

Link a custodial wallet to the card as a funding source.

- `linkWalletToCard` posts the wallet's `addressId` to `/v1/wallet/internal/card_linked`.
- `getInternalWallets` now answers `addressId`, optional, which is what the link is made by.
- `getCardLinkedWallets` gains a `CardLinkedWallets` tag the link invalidates, and only a made link invalidates it: neither an error nor a `success: false` answer changed the set.
