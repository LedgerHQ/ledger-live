---
"@ledgerhq/device-intent": patch
---

Enrich `ExecutorState` with the data the state machine has accumulated up to each transition: `initializingDeviceContext` now carries `connectionResult`, while `executingIntent` and `executingIntentError` carry both `connectionResult` and `extractedContext`. This is purely additive and lets host apps drive analytics or post-connection logic without keeping their own out-of-band copy of the connection / extraction results.
