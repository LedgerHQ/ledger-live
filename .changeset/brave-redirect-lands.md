---
"@features/flow-pay-card-auth": minor
"live-mobile": minor
---

Complete the Pay Card login from the Baanx redirect (LIVE-34742)

An XState 5 machine now owns the journey: it mints and stores the PKCE attempt, starts the
authorization, opens the OS browser, compares the `state` on the redirect, exchanges the code, stores
the session, and reads `GET /v1/user` into the RTK Query cache. On mobile the redirect arrives either
from the browser session or from the `ledgerlive://paytab?code=…&state=…` deep link, and the first one
wins. `CardLogin` shows the login action only when there is something to log in to, and renders nothing
once the user is signed in.
