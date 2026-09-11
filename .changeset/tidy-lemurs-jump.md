---
"@features/flow-pay-card-auth": patch
---

fix(pay-card): ignore a stray login redirect from an abandoned attempt

A redirect from an attempt the user had already retried away from could still land after a fresh attempt started, get exchanged against the new attempt's verifier, fail, and wipe that new attempt. The authorize URL now carries a local attempt id that the app compares against the current attempt before acting on a redirect.
