---
"@features/flow-pay-card-auth": minor
---

Show the signed-in card holder, and let them log out

`CardLogin` now renders the card holder once the login succeeds — the account id and the verification
state, which is everything the user schema holds — beside a logout action. Logout tells the provider
first, while the session can still authorize that call, then clears the session, the login attempt and
the Card cache, and the login action comes back. A logout on a dead network still logs the user out on
this device.
