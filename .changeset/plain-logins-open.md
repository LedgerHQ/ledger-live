---
"@features/flow-pay-card-auth": minor
"@domain/api-card-management": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Open the Baanx authorize page directly, and drop the CSRF state (LIVE-36301)

The login no longer asks the backend where to send the user. It builds the authorize URL itself and
opens the secure browser on it, and the provider hosts the page and owns the redirect. That removes a
network call, a machine state and one way a login could fail.

```
GET {CARD_API_URL}/v1/auth/oauth2/authorize
  ?client_id=…&response_type=code
  &scope=openid profile email platform:full offline_access
  &redirect_uri=…&code_challenge=…&code_challenge_method=S256&prompt=consent
```

The attempt is now a PKCE pair alone. The redirect carries `code`, and the `state` that used to travel
with it is gone, because PKCE already ties the code to the verifier on disk: the provider issues the
code against this attempt's challenge, so no other attempt can exchange it. The token exchange still
sends the same `redirect_uri`, and both token grants move to `/v1/auth/oauth2/token`.

`oauthConfig` gains `apiUrl`, which is the host the authorize page lives on.
