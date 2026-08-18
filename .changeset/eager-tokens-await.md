---
"@shared/api-services": minor
"@features/platform-card": minor
---

Read the Pay Card session token asynchronously (LIVE-34742)

`cardApiExtra.getCardSessionToken` now returns a promise, and the Card base query awaits it. The
session is about to live in OS secure storage, which only reads asynchronously. Behaviour does not
change yet: the accessor still answers from memory.

An await can reject, and `BaseQueryFn` must always answer with a result. A session port that rejects
now gives a `CUSTOM_ERROR` result, so every caller still reads an `error.status`.
