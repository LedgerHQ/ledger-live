---
"ledger-live-desktop": minor
"live-mobile": minor
---

Wire fetchRemoteFlags into createFeatureFlagsMiddleware for LWD and LWM. Centralize Firebase fetch behind a shared module so the Redux slice and the legacy Context provider stay synchronized.
