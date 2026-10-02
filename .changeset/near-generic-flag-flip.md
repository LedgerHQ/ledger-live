---
"@ledgerhq/live-common": minor
---

Add NEAR to `genericCoinFrameworkFamilies.json` (LIVE-36413). The route stays behind the `config_near_generic_bridge` LiveConfig key, which defaults to `false`, so NEAR keeps running on the legacy bridge until the key is enabled remotely.
