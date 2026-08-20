---
"@features/flow-pay-card-auth": minor
"@shared/env": patch
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

`CARD_OAUTH_REDIRECT_URI` now defaults to `https://go.ledger.com/ledger/card-baanx`. The provider
whitelists an HTTPS address, and it must match on the token exchange too.

`CARD_OAUTH_DEEP_LINK` is new, and it holds the app's own link, `ledgerlive://paytab`. The redirect
above lands on it, and the secure browser session ends on it. One value cannot serve both: the
provider accepts no custom scheme, and the session ends on nothing else. `ASWebAuthenticationSession`
takes the scheme of this value as its `callbackURLScheme`, and the Android polyfill matches the
incoming link against the whole of it.
