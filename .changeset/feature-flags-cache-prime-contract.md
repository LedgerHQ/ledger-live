---
"@shared/feature-flags": minor
---

fix(feature-flags): let the middleware prime from a device-local flag cache

`createFeatureFlagsMiddleware` accepts two new optional callbacks:

- `readCachedFlags`, read before the first `fetchRemoteFlags` and without any network, so boot
  resolves on the last values the backend actually sent rather than on compiled defaults. An
  empty result is treated as "no cache" and leaves readiness to the network path, so a
  first-ever install never arms the gate on defaults.
- `onRemoteFlagsError`, invoked once per failed read with its stage, attempt number and whether
  any values are held yet. Purely observational: the return value is ignored and a throwing
  handler cannot stop the poll loop. Failed fetches used to be swallowed silently.

Both are opt-in. A middleware configured without `readCachedFlags` behaves exactly as before.
