---
"@domain/api-card-management": minor
---

Add `unlinkWalletFromCard` for `DELETE /v1/wallet/internal/card_linked`.

- Identifies the wallet by `addressId`, and reuses the link request/response schemas.
- Invalidates `CardLinkedWallets` only on `success: true`, matching `linkWalletToCard`.
