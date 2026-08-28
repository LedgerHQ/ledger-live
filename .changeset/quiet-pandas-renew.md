---
"@shared/api-services": minor
"@domain/api-card-management": minor
"@features/platform-card": minor
"@features/flow-pay-card-auth": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Renew the Baanx Pay Card session without a new login

An authenticated Card request that answers 401 now starts one shared refresh, stores both rotated
tokens, and replays the same request once. The base query sends the id of the session it used, so a
request that a logout or a new login overtakes never replays with the new user's token, and never
clears the new user's session. That request answers a stale-request error rather than a 401, and the
login flow leaves the session alone.

A renewal has one outcome that keeps the session: a new session on disk. **Every other answer ends
it.** Any 4xx, any 5xx, a timeout, a lost connection, a 200 the wire schema rejects, a store that
cannot be read and a write that failed all clear the session and return the login screen. Nothing
reads a status, and nothing reads a body.

That is a deliberate trade. One rule is easier to reason about and to test than a table of OAuth2
error codes, and it leaves no way for a session to look alive and behave dead. It costs a sign-out
for every user who opens the app during a Baanx outage on the token endpoint, and the same for a
release that ships a wrong `x-client-key`. Accepted.

On the request path itself, nothing ends a session by accident. The native store rejects a read the
OS refused rather than answering "no session", and the base query reports that failure instead of
sending a request with no Bearer. An absent session ends one; a locked keychain must not.

The client renews nothing ahead of a failure, so it stores no expiry and reads no clock.

Card OAuth2 credentials no longer enter a redux action. Both token grants are plain thunks rather
than endpoints, so dispatching one runs it and dispatches nothing, and the Card base query reports no
metadata at all in place of the `Request` whose headers hold the Bearer. This matters on mobile,
where the DevTools relay accepts no action sanitizer.

Migration: the Card session has not shipped, so only development devices hold one. The two session
keys keep their names, so this build reads a session an earlier build stored. An earlier build also
wrote a third key that nothing reads any more, and the next logout or terminal cleanup removes it.
