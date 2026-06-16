---
"live-mobile": minor
---

feat(lwm): add the confirmation step to the new send flow

- Add the full-screen "Transaction signed" success step shown after broadcast on mobile.
- Render an error state (instead of a hardcoded success) when the broadcast fails after signing, based on the flow status from the send context.
