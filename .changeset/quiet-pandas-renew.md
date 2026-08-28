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
token, and replays the request once. A dead refresh token clears every Card authentication state
and returns the user to the login screen.

Nothing is renewed ahead of a failure, so no expiry is stored and no clock is read. The Card session
has not shipped, so nothing migrates: a session stored by an earlier build is simply not read, and the
user signs in again.

Card OAuth2 credentials no longer reach the desktop log export or Redux DevTools: the refresh endpoint
takes no argument, both token grants run with `track: false`, and a sanitizer strips every Card action.
