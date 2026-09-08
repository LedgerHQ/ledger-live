---
"@domain/api-card-management": minor
---

Add `linkCardWallet` and `unlinkCardWallet` for `POST` and `DELETE /v1/wallet/internal/card_linked`.

- Both identify the wallet by `addressId`, which is now kept from `/v1/wallet/internal` rather than dropped: without it neither endpoint can be called.
- Both invalidate a new `CardLinkedWallets` tag that `getCardLinkedWallets` provides, so the charging order reloads itself.
- Neither touches the internal wallets: unlinking leaves the wallet and its funds alone.
