---
"live-mobile": patch
"@ledgerhq/live-common": patch
---

Open the swap transaction status drawer directly when the multi-step flow redirects to history, so it no longer depends on the just-broadcast operation already being synced into local history. While the swap operation is still unresolved, the status controller now retries on a short interval so the status section stops showing skeletons within seconds instead of waiting a full poll cycle.
