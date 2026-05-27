---
"@ledgerhq/live-common": patch
---

async prep useBridgeTransaction — wrap the pre-tx sync path with `from(Promise.resolve(getAccountBridge(...)))` so the hook stays compatible when `getAccountBridge` becomes async
