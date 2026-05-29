---
"live-mobile": minor
---

fix(lwm): prevent double broadcast in PlatformCompleteExchange and useSignedTxHandler by setting an in-flight guard synchronously before the async broadcast call (LWM)
