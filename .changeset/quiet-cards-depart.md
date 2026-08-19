---
"@features/flow-pay-card-auth": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Show the signed-in card holder, and let them log out

`CardLogout` is a new component, and it is the only one that knows about logging out. It shows the
account id and the verification state, which is everything the user schema holds, beside a logout
action. Logout tells the provider first, while the session can still authorize that call, then clears
the session, the login attempt and the Card cache. A logout on a dead network still logs the user out
on this device.

The two directions stay apart. `CardLogin` runs the login and shows nothing once somebody is signed
in; `CardLogout` shows nothing until somebody is. Each one decides that for itself, so the Pay tab
places both and passes `CardLogout` nothing.

They agree through one Redux flag, `payCardAuth.isSignedIn`, because two login machines would each
hydrate the session and neither would agree with the other. The machine writes the flag on entering
`ready`, `idle` and `error`. `CardLogout` writes it once a logout is through, and the machine takes a
`SESSION_ENDED` event to put the login back on offer.
