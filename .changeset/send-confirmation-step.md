---
"live-mobile": minor
---

feat(lwm): add the confirmation step to the new send flow

- Add the confirmation screen shown after the device signature: a single screen that renders success or error based on the send flow status.
- Success: full-screen "Transaction signed" with "View transaction" / "Close".
- Error: a guard on top of the device flow (e.g. broadcast failure) showing the failure reason, "Save logs" and "Try again" / "Close".
