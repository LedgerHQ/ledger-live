---
"@domain/api-card-management": minor
---

Align the Card schemas and their tests with the provider's documented responses:

- Test payloads are now the documented examples, field for field, instead of invented ones. The card id is a digit string (`"000000000050277836"`), not a uuid — which is why the schema does not pin one.
- Drops test data that injected `pan`, `cvv`, `pin` and `cardId`. The status response documents none of them, so those cases asserted behaviour against a payload the provider never sends.
- Adds `PayCardErrorResponseSchema` for the `{ message }` body every documented Card error returns, and builds the error fixtures through it. Deliberately not wired to `rawErrorResponseSchema`: a validation failure there would replace the `FetchBaseQueryError`, and `isUnauthorizedError` reads `status === 401` off it to end a session.
- The 404 fixture now carries the documented `"Card not found"` body.
