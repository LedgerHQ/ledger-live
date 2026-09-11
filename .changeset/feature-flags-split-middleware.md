---
"@shared/feature-flags": minor
---

refactor(feature-flags): split the middleware body into named helpers

`createFeatureFlagsMiddleware` now assembles a handful of small module-private helpers instead of
inlining them, so its body reads as: build the collaborators, pick one of the two start-ups,
return the middleware. `pollRemoteFlags` takes a deps object rather than seven positional
arguments. Behaviour and public API are unchanged.
