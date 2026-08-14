---
"@domain/api-card-management": minor
"@features/flow-pay-card-auth": minor
"@shared/api-services": minor
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
`ASWebAuthenticationSession` matches the callback against it, and so does the Android polyfill. The
opener only opens the URL; the redirect goes back to the app, so the browser result is not read and
closing the browser shows no error — a cancelled login is not a failed one.

The initiation carries `mode=api`. Without it the endpoint answers `302` and redirects to the hosted
UI, which a `fetch` follows into an HTML page; `api` returns the same URL as JSON instead.

The request goes through `useInitiateAuthorizeMutation` from `@domain/api-card-management`, which owns
the Card Auth contract and injects it into the shared `cardApi` service. Every endpoint there is
declarative — `query`, `rawResponseSchema`, `transformResponse`, `responseSchema` — so the wire shape
is validated at the boundary and mapped in one place. `cardApiExtra` keeps only what the base query
needs: the base URL, the Baanx client key for the `x-client-key` header, and the session accessors.

The OAuth client id and redirect URI are the app's, so they reach `CardLogin` as an `oauthConfig`
prop: one value goes to the initiation and to the secure browser, and the token exchange will send it
again. Baanx uses the same value for the client key and the OAuth `client_id`, and the provider matches
`ledgerlive://paytab` verbatim on the token exchange. Each platform container opens the returned URL
itself, and no host-provided opener is needed. The Baanx secret key stays server-side and is never
sent from the apps.

The challenge is spent on the initiation, and nothing keeps the attempt afterwards. Completing the
callback — holding the `state` and the verifier, verifying the `state`, exchanging the code for
tokens and storing them in `expo-secure-store` — is the remainder of LIVE-34738 and is not part of
this change.
