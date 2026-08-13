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
`ASWebAuthenticationSession` matches the callback against it, and so does the Android polyfill.
Closing the browser resolves that session rather than rejecting it, so the attempt is dropped on the
way out and no error is shown — a cancelled login is not a failed one.

The initiation carries `mode=api`. Without it the endpoint answers `302` and redirects to the hosted
UI, which a `fetch` follows into an HTML page; `api` returns the same URL as JSON instead.

The request goes through `useInitiateAuthorizeMutation` from `@domain/api-card-management`, which owns
the Card Auth contract and injects it into the shared `cardApi` service. Both apps configure the base
URL, Baanx client key and OAuth redirect URI once through `cardApiExtra`. The service uses the key for
the `x-client-key` header, while the OAuth endpoints reuse it as `client_id` and use the same
`ledgerlive://paytab` redirect for authorization and token exchange.

The `state` and verifier the callback and token exchange will need are held in the `payCardAuth`
slice, which neither app persists, and are dropped as soon as an attempt ends. `CardLogin` carries no
OAuth configuration and no host-provided opener: authorization initiation returns the resolved
redirect URI with the hosted URL so the native secure browser can match the callback, and each
platform container opens that URL itself. The Baanx secret key stays server-side and is never sent
from the apps.

Completing the callback — verifying `state`, exchanging the code for tokens and storing them in
`expo-secure-store` — is the remainder of LIVE-34738 and is not part of this change.
