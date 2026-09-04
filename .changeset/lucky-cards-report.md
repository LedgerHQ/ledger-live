---
"@domain/api-card-management": minor
---

Add the `getCardStatus` query for `GET /v1/card/status`.

- Makes an ordered card observable: `orderCard` answers `{ success: true }` and nothing else.
- New `CardStatus` cache tag — provided by the query, invalidated by `orderCard`, so a successful
  order refetches the status on its own.
- `PayCardStatusResponseSchema` stays narrow, keeping any PAN, CVV or PIN the endpoint might grow out
  of the RTK Query cache.
- A user who never ordered a card surfaces as `error.status === 404`, not as an empty success.
- Drops the unused `CardManagement` tag, which no endpoint provided or invalidated.
