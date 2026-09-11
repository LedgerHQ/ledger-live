---
"@shared/feature-flags": minor
---

fix(feature-flags): let the middleware prime from a device-local flag cache

`createFeatureFlagsMiddleware` accepts two new optional callbacks:

- `readCachedFlags`, read before the first `fetchRemoteFlags` and without any network, so boot
  resolves on the last values the backend actually sent rather than on compiled defaults. The
  prime changes which values boot resolves on, not when readiness is announced: that stays
  with the first fetch settling, so the boot gates keep the meaning they already had. The one
  exception is a middleware given a cache reader and no fetcher, where nothing else would ever
  settle: there the prime re-resolves once and arms the gate itself.
- `onRemoteFlagsError`, invoked once per failed read with its stage, attempt number and whether
  any values are held yet. Purely observational: the return value is ignored and a throwing
  handler cannot stop the poll loop. Failed fetches used to be swallowed silently.

Both are opt-in. A middleware configured without `readCachedFlags` behaves exactly as before.
