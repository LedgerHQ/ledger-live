---
"live-mobile": minor
"@ledgerhq/device-intent": minor
---

Add generic error UI for the DeviceIntentExecutor (LWM) covering connection, intent and invalid-operation failures, and wire the executor's `onUserCancel` callback to every phase as a uniform `onClose` prop so platform and intent components can offer a close action.
