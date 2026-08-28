---
"@shared/api-services": minor
"@domain/api-card-management": minor
"@features/platform-card": minor
"@features/flow-pay-card-auth": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Renew the Baanx Pay Card session without a new login

The Card session now refreshes its access token after the provider answers 401, rotates the refresh
token, and replays the request once. The base query sends the id of the session it used, so a
request that a logout or a new login overtakes never replays with the new user's token, and never
clears the new user's session.

A renewal has one outcome that keeps the session: a new session on disk. **Every other answer ends
it.** A 400, a 422, a 498, a 499, a 5xx, a timeout, a lost connection, a 200 the wire schema rejects
and a write that failed all clear the session and return the login screen. Nothing reads a status,
and nothing reads a body.

That is a deliberate trade. One rule is easier to reason about and to test than a table of OAuth2
error codes, and it leaves no way for a session to look alive and behave dead. It costs a sign-out
for every user who opens the app during a Baanx outage on the token endpoint, and the same for a
release that ships a wrong `x-client-key`. Accepted.

Two answers still keep the session, and neither is a judgement about the credential: a request whose
session a new login replaced, and an app that never installed the renewal. Both answer
`card_renewal_unavailable`, and the login flow reads that body and keeps the session. The native
store also rejects a read the OS refused, rather than answering "no session", so a locked keychain
cannot log a user out.

The client renews nothing ahead of a failure, so it stores no expiry and reads no clock.


Card OAuth2 credentials no longer enter a redux action. Both token grants take their credential off
the api's `extra` and answer with a handle instead of a session, and the Card base query reports a
request URL, a method and a response status in place of the `Request` whose headers hold the Bearer.
This matters on mobile, where the DevTools relay accepts no action sanitizer.

Migration: the Card session has not shipped, so only development devices hold one. The two session
keys keep their names, so this build reads a session an earlier build stored. An earlier build also
wrote a third key that nothing reads any more, and the next logout or terminal cleanup removes it.
