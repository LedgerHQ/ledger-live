---
"@ledgerhq/live-common": minor
---

Report the originating live-app or dApp on sign-stage `earn_transaction_failed` events.

`manifestId` came only from `broadcastConfig.source`, which does not exist at the sign stage. So the Earn live-app skip in `toSegmentTrackEvent` — which keys on the manifest — could never fire there, and every device rejection inside the Earn app was counted twice: once by the Earn app, once by the seam. Successes were unaffected, because success is reported at broadcast where the skip works.

`withLiveAppContext` already scopes the manifest id around every wallet-api and dApp signing call, so the seam reads it instead of changing the bridge signature. That choice is deliberate rather than lazy: mobile's legacy wallet-api path never forwards the manifest to the device action, so an argument would have missed that route entirely.

The route *type* still waits for broadcast — the context carries an id, not a source — so the sign stage keeps `tx_pathway: "unknown"`.

The context is a singleton restored around an `await`, not an `AsyncLocalStorage`, so two overlapping signatures would misattribute the second. Device signing serialises today, one device and one prompt, and a test pins the restore behaviour. LIVE-36571 removes the dependency by passing the source explicitly.
