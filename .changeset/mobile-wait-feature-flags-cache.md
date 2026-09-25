---
"live-mobile": minor
---

fix(feature-flags): wait for the flag cache before the first render

`LedgerStoreProvider` now waits for the feature-flags cache read, in parallel with the storage
reads it already awaits, before flipping `ready`. Providers rendered above `WaitForAppReady` used
to mount on the compiled defaults when they won the race against the cache, which is how a
flag-gated language could be persisted back to English.

A feature-flags re-resolution that throws at boot is now reported, with `console.error` and an
explicit `DdRum.addError`, since it happens before Datadog starts intercepting console errors.
