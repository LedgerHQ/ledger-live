---
"@domain/api-card-management": minor
---

Add the `orderCard` mutation for `POST /v1/card/order`.

- A mutation, not a query: ordering a card is not idempotent and Baanx offers no idempotency key.
- Takes no argument — `VIRTUAL` is the only type the provider issues today, so the body is fixed.
- `PayCardOrderResponseSchema` declares `success` alone, keeping anything else the order answers with
  out of the RTK Query cache.
- The base query already sends the base URL, `x-client-key` and the Bearer token, so the endpoint
  restates none of it.
