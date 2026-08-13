---
"@features/flow-pay-card-auth": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Start the Baanx login with a PKCE challenge and a CSRF state (LIVE-34738)

Pressing Login now mints a login attempt client-side — a 16-byte `state` and a 32-byte PKCE verifier,
with `code_challenge = BASE64URL(SHA256(verifier))` — and sends it to
`GET /v1/auth/oauth/authorize/initiate`, whose `{ token, url }` answer is opened in the platform
secure browser as before. The randomness comes from the platform CSPRNG on each side: `expo-crypto`
on mobile, WebCrypto on desktop.

The request goes through `useInitiateAuthorizeMutation` from `@domain/api-card-management`, which owns
the Card Auth contract and injects it into the shared `cardApi` service. The base URL and the
`x-client-key` header are already supplied by `cardApiExtra` from `CARD_API_URL` and
`CARD_BAANX_CLIENT_KEY`, so no use case carries either.

The `state` and verifier the callback and token exchange will need are held in the `payCardAuth`
slice, which neither app persists, and are dropped as soon as an attempt ends. The OAuth `client_id`
and the registered redirect URI reach the flow as a prop, since each app owns that configuration:
Baanx reuses the client key as `client_id`, and the redirect URI is the Pay tab deep link. Desktop
resolves the key through `getEnv`; mobile reads `Config` directly, because what copies `Config` into
the env system resolves asynchronously, after the value is captured. The Baanx secret key stays
server-side and is never sent from the apps.

Completing the callback — verifying `state`, exchanging the code for tokens and storing them in
`expo-secure-store` — is the remainder of LIVE-34738 and is not part of this change.
