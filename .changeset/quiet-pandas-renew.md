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
token, and replays the request once. The base query sends the epoch of the session it used, so a
request that a logout or a new login overtakes never replays with the new user's token, and never
clears the new user's session.

Only a 401, or a 400 that names a terminal OAuth2 grant error, ends a session. A 5xx, a timeout, a
lost connection, or a 400 error page from a proxy answers the caller with `card_renewal_unavailable`
instead, and the login flow keeps the session. The native store now rejects a read the OS refused,
rather than answering "no session", so a locked keychain cannot log a user out.

The client renews nothing ahead of a failure, so it stores no expiry and reads no clock.

Card OAuth2 credentials no longer enter a redux action. Both token grants take their credential off
the api's `extra` and answer with a handle instead of a session, and the Card base query reports a
request URL, a method and a response status in place of the `Request` whose headers hold the Bearer.
This matters on mobile, where the DevTools relay accepts no action sanitizer.

Migration: the Card session has not shipped, so only development devices hold one. The two session
keys keep their names, so this build reads a session an earlier build stored. An earlier build also
wrote a third key that nothing reads any more, and the next logout or terminal cleanup removes it.
