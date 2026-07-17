---
"@features/platform-currencies": minor
---

Add `buildStandaloneCryptoAssetsStore` — a crypto-assets token store that configures its own Redux store, for runtimes without an application store (CLI scripts, monitoring jobs, integration-test setup). Complements `buildCryptoAssetsStore`, which binds to an existing store's `dispatch`.
