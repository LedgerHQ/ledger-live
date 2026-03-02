---
"@ledgerhq/live-common": minor
---

Improve resilience when market API returns no data for a currency id (e.g. unknown or unsupported coin). Prevents "Cannot read property 'id' of undefined" crash in getCurrencyData; query now returns undefined instead of throwing.
