---
"@features/flow-pay-card-auth": minor
---

Forget the cached Card user when a 401 ends the session, not only on an explicit logout.

- The logout already dispatched `resetApiState()`; the involuntary path cleared the keychain session
  and left the RTK cache behind.
- That cache holds the holder name, PAN last 4 and verification state, so the next person to sign in
  on the device could be served the previous holder's data before a refetch landed.
- `forgetUser` is now a login port too, called wherever the session is cleared.
