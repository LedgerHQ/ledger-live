---
"@shared/feature-flags": minor
---

fix(feature-flags): expose when the local cache read has settled

The slice gains a transient `cachedFlagsSettled` flag, read with `selectCachedFlagsSettled`. The
middleware arms it once the `readCachedFlags` prime settles, whether it primed, was empty or failed,
and re-resolves first so an empty cache still gets env overrides and version filters applied. It
never waits on the network, unlike `remoteFlagsReady`. Without a cache reader it is armed right away.

A store configured with neither a cache reader nor a fetcher now arms `remoteFlagsReady` too, instead
of leaving it `false` forever.

A reducer or a downstream middleware that throws while the slice is re-resolved no longer aborts
the boot sequence: the exception is reported to `onRemoteFlagsError` with the new `sync` stage, and
`cachedFlagsSettled` and `remoteFlagsReady` are armed anyway, so a startup waiting on them is never
stranded.
