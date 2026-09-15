---
"@domain/api-card-management": minor
---

Expose the provider's hosted page for setting or changing the card PIN.

- `createCardSetPinToken` posts to `/v1/card/set-pin/token` and answers a single-use token and the `hostedPageUrl` that spends it.
- A mutation, like `createCardDetailsToken`: the token is spent when the page opens, so the answer must never be served from a cache. Dispatch with `track: false`.
- `hostedPageUrl` and `redirectUrl` must be `https:` — the app opens one and the provider navigates to the other.
- `redirectUrl` and `isEmbedded: true` cannot be asked for together: an embedded page posts a message instead of navigating.
- `customCss` carries the provider's seven documented styling fields. No caller styles the page yet; the names and types are the API reference's, unverified against a live response.
