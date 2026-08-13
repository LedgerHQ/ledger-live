---
"@domain/api-card-management": minor
"@features/flow-pay-card-auth": minor
"@shared/env": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Start the Baanx login with a PKCE challenge and a CSRF state (LIVE-34738)

Pressing Login now mints a login attempt client-side — a 16-byte `state` and a 32-byte PKCE verifier,
with `code_challenge = BASE64URL(SHA256(verifier))` — and sends it to
`GET /v1/auth/oauth/authorize/initiate`, whose `{ token, url }` answer is opened in the platform
secure browser as before. The randomness comes from the platform CSPRNG on each side: `expo-crypto`
on mobile, WebCrypto on desktop.

The redirect URI now reaches the secure browser too, since that is what ends the session:
`ASWebAuthenticationSession` matches the callback against it, and so does the Android polyfill.
Closing the browser resolves that session rather than rejecting it, so the attempt is dropped on the
way out and no error is shown — a cancelled login is not a failed one.

The initiation carries `mode=api`. Without it the endpoint answers `302` and redirects to the hosted
UI, which a `fetch` follows into an HTML page; `api` returns the same URL as JSON instead.

The request goes through `useInitiateAuthorizeMutation` from `@domain/api-card-management`, which owns
the Card Auth contract and injects it into the shared `cardApi` service. The base URL and the
`x-client-key` header are already supplied by `cardApiExtra` from `CARD_API_URL` and
`CARD_BAANX_CLIENT_KEY`, so no use case carries either.

The `state` and verifier the callback and token exchange will need are held in the `payCardAuth`
slice, which neither app persists, and are dropped as soon as an attempt ends. The OAuth `client_id`
and the redirect URI reach the flow as a prop, since each app owns that configuration: Baanx reuses
the client key as `client_id`, and the redirect URI comes from the new `CARD_OAUTH_REDIRECT_URI`,
which defaults to `https://ledger.com` — the value Baanx has whitelisted, and the one the token
exchange has to match. Both apps resolve every one of these through `getEnv`. The Baanx secret key
stays server-side and is never sent from the apps.

Completing the callback — verifying `state`, exchanging the code for tokens and storing them in
`expo-secure-store` — is the remainder of LIVE-34738 and is not part of this change.
