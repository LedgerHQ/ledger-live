---
"@features/flow-pay-card-auth": minor
"@devtools/pay-card": minor
"@devtools/bindings": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Show a Card login intro sheet on the first `Login` press (LIVE-36793). The sheet has two buttons,
"Create an account" and "Log in to Baanx", and both run the same OAuth2 hosted login. The intro shows
once: a new persisted `payCardLoginIntro` flag goes up when a login the card holder just started
reaches `ready`, and it survives an app restart inside the shared `payCard` blob. A hydrated session
raises nothing. A tester resets the flag from the Pay Card devtool, and the intro shows again on the
next `Login` press.
