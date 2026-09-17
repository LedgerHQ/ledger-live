---
"@domain/api-card-management": minor
---

Show the card's PIN without ever handling the digits.

- `createCardPinToken` posts to `/v1/card/pin/token` and answers a single-use token and the `imageUrl` that renders the PIN, so the digits never reach the app as a value.
- A mutation, like `createCardDetailsToken`: the token is spent once the image has been read, so the answer must never be served from a cache. Dispatch with `track: false`.
- `customCss` takes the two colours this endpoint documents. Anything else — the card details image's four included — is dropped on parse and never sent.
