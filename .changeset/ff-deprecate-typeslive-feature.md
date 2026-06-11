---
"@ledgerhq/types-live": minor
---

Deprecate the legacy feature-flag types in `feature.ts` (`Feature`, `Features`, `FeatureId`, `FeatureMap`, `OptionalFeatureMap`, `FeatureParam`, and all `Feature_*`). The Ledger Live feature-flag registry has moved to `@shared/feature-flags`; every export now carries a `@deprecated` annotation pointing to its replacement (e.g. `Feature_Noah` → `Features["noah"]`). The types stay exported for backward compatibility and are slated for removal in a future major.
