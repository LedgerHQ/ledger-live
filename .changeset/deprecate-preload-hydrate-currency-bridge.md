---
"@ledgerhq/types-live": patch
---

Deprecate `preload` and `hydrate` on `CurrencyBridge` interface — both methods are now optional. Prefer loading data lazily in UI flows instead of eagerly via these methods.
