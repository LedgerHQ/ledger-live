---
"@domain/api-card-management": minor
---

Add `getCardTransactions` for `GET /v1/card/transactions`.

- Newest first, paged by number. The provider answers with a bare array, so a short page is how a caller learns it reached the end.
- Narrowed to what a transaction list shows. The card and processor ids, the MCC number, the conversion rates and the funding sources are left undeclared, so Zod drops them before they reach the cache.
- `declineReason` accepts the `""` the provider sends on a transaction that was not declined.
- `dateFrom` and `dateTo` are validated as a pair before the request goes out, because the provider rejects one without the other.
