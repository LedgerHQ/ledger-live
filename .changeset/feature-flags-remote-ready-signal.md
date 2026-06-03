---
"@shared/feature-flags": minor
---

Add a Redux-backed `remoteFlagsReady` boot-readiness signal: a `remoteFlagsReady` state field (initial `false`), an idempotent `setRemoteFlagsReady` reducer, and a `selectRemoteFlagsReady` selector. The middleware dispatches the signal once after the first remote-flag fetch settles — success or failure. The field is transient and never persisted, so it re-arms every session.
