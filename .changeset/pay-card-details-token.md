---
"@domain/api-card-management": minor
---

Add `createCardDetailsToken` for `POST /v1/card/details/token`.

- Answers with a single-use token and an image URL that renders PAN, CVV and expiry, so the app never handles the card data itself.
- A mutation, not a query: the provider spends the token on first use, so the answer must never be served from a cache.
- Takes the documented `customCss` colours, and validates them as hex before the provider answers 422.
