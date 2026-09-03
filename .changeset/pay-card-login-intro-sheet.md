---
"@features/flow-pay-card-auth": minor
"@features/flow-pay-card": minor
"@devtools/pay-card": minor
"@devtools/bindings": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Show a Card login intro sheet on the first press of the card's action (LIVE-36793). The sheet has two
buttons, "Create an account" and "Log in to Baanx", and both run the same OAuth2 hosted login. The
intro shows once: a new persisted `payCardLoginIntro` flag goes up when a login the card holder just
started reaches `ready`, and it survives an app restart inside the shared `payCard` blob. A hydrated
session raises nothing. A tester resets the flag from the Pay Card devtool, and the intro shows again
on the next press.

The same flag now picks what the login block says, from the app's new `payTab.cardLogin.*` keys. It
sells the card while the flag is down — "Get 1% cashback everytime you spend" under a `Get card`
button that opens the intro — and offers a login once the flag is up: "Log in to access your card"
under a `Login` button that starts one. Its title is `Crypto Card`, and on mobile it is a Lumen
`Subheader` under the card face, so the Pay Card flow no longer draws a section title above it there.
Desktop keeps its host-provided title.

The virtual card row names one wallet only: Apple Pay on iOS, Google Pay on Android. Desktop cannot
see the phone the card will be added to, so it keeps naming both. Each row wraps its title and its
description over as many lines as the copy needs, instead of cutting both off at the first.
