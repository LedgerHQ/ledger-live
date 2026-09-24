---
"@shared/feature-flags": minor
---

fix(feature-flags): expose when the local cache read has settled

The slice gains a transient `cachedFlagsSettled` flag, read with `selectCachedFlagsSettled`. The
middleware arms it once the `readCachedFlags` prime settles, whether it primed, was empty or failed,
and re-resolves first so an empty cache still gets env overrides and version filters applied. It
never waits on the network, unlike `remoteFlagsReady`. Without a cache reader it is armed right away.
