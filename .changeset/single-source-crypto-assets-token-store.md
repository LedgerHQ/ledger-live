---
"ledger-live-desktop": minor
"live-mobile": minor
---

Register a single crypto-assets token cache per app store, backed by the new domain token api and its persistence, and inject the legacy getCryptoAssetsStore singleton over it. This guarantees one runtime source of token data: the UI and coin-modules share the same cache.
