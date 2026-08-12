---
"@features/flow-pay-card-auth": minor
"@shared/api-services": minor
"@shared/env": patch
"ledger-live-desktop": minor
"live-mobile": minor
---

Start the Baanx login with a real client key, PKCE challenge and CSRF state (LIVE-34738)

The Baanx client key that every Card request carries as `x-client-key` now comes from the new
`CARD_BAANX_CLIENT_KEY` env var, resolved by each app and passed to `payCardApiExtra`, so the shared
base query sets the header for all endpoints and no use case carries it. It defaults to empty on
purpose: an unset key fails Card requests with 499 rather than stopping the apps from starting. The
Baanx secret key stays server-side and is never sent from the apps.

Pressing Login then mints a login attempt client-side — a 16-byte `state` and a 32-byte PKCE verifier,
with `code_challenge = BASE64URL(SHA256(verifier))` — and sends it to
`GET /v1/auth/oauth/authorize/initiate`, whose `{ token, url }` answer is opened in the platform
secure browser as before. The randomness comes from the platform CSPRNG on each side: `expo-crypto`
on mobile, WebCrypto on desktop.

The `state` and verifier the callback and token exchange will need are held in the `payCardAuth`
slice, which neither app persists, and are dropped as soon as an attempt fails. The OAuth `client_id`
and the registered redirect URI reach the flow as a prop, since each app owns that configuration:
Baanx reuses the client key as `client_id`, and the redirect URI is the Pay tab deep link.

Completing the callback — verifying `state`, exchanging the code for tokens and storing them in
`expo-secure-store` — is the remainder of LIVE-34738 and is not part of this change.
