---
"@features/flow-pay-card-auth": minor
"@domain/api-card-management": minor
"@features/platform-card": minor
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
  &scope=openid profile email offline_access
  &redirect_uri=…&code_challenge=…&code_challenge_method=S256&prompt=consent
```

The attempt is now a PKCE pair alone. The redirect carries `code`, and the `state` that used to travel
with it is gone, because PKCE already ties the code to the verifier on disk: the provider issues the
code against this attempt's challenge, so no other attempt can exchange it. Both token grants move to
`/v1/auth/oauth2/token`, and neither repeats `redirect_uri` there: Baanx's contract for that endpoint
takes only `grant_type`, `code`, and `code_verifier`.

`oauthConfig` gains `apiUrl`, which is the host the authorize page lives on.

`prepareAttempt` builds the authorize URL, rather than the transition that follows it. The URL builder
throws on a misconfigured `apiUrl`, and a throw inside an action stops the machine instead of reaching
a transition. From the actor it lands on `onError`, which wipes the stored attempt and reports a
failure the user can retry.

A live exchange against Baanx's UAT environment answered with no `refresh_token_expires_in`, which
`PayCardSessionResponseSchema` required. That field is gone from the schema, the session, and the
stored lifetimes: Baanx's contract carries no lifetime for the refresh token, only for the access
token, so nothing here can track one.
