---
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(feature-flags): prime the flag slice from the device cache at store creation

Both stores now pass `readCachedFlags` to the feature-flags middleware, so the slice resolves on
the values Firebase last sent to this device before the first network fetch is attempted.

They also pass an `onRemoteFlagsError` reporter. Failed flag reads used to be swallowed entirely.
It warns only on a cold failure, when no values are held yet and the session really is running on
compiled defaults; a failed poll that still has previous values is routine and stays silent.

On desktop, disabling `fetchRemoteFlags` (as tests do) now disables the cache read too, so opting
out of the backend opts out of the whole Firebase path.
