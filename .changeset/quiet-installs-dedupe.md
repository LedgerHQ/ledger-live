---
"@ledgerhq/live-dmk-shared": minor
---

Reduce `EnsureAppReadyState` installing-app variant to `{ type }` only so consecutive emissions during installation dedupe via deep-equality and render at most once
