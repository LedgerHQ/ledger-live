---
"@features/platform-currencies": minor
---

Declare `@reduxjs/toolkit` as a runtime dependency (moved from `devDependencies`). `buildStandaloneCryptoAssetsStore` calls `configureStore` at runtime, so consumers building a standalone store need RTK resolvable as a real dependency.
