---
"@features/flow-pay-card-auth": minor
"@shared/env": minor
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

`oauthConfig` gains `deepLink`, which is what closes the secure browser.
`ASWebAuthenticationSession` takes the scheme of this value as its `callbackURLScheme`, and the
Android polyfill matches the incoming link against the whole of it.

One value cannot serve both jobs. The provider accepts an `https` redirect URI alone, and only a
custom scheme ends a browser session. With no value that matches, the login still completes through
the app's own deep link, but nothing closes the browser and it stays on top of the Pay tab.

Mobile takes the value from `PAY_TAB_DEEP_LINK`, a new constant that sits beside the linking config
and shares the path that config maps onto the Pay tab, so the two cannot drift. It is not an
environment variable: the scheme is declared in `AndroidManifest.xml` and `Info.plist`, so it cannot
change without a release. Desktop passes no `deepLink`, because the user's own browser opens the page
and reports nothing back (LIVE-34740).
