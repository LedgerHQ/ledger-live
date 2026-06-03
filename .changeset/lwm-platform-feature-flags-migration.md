---
"live-mobile": minor
---

Migrate all in-app feature-flag hook imports to `@features/platform-feature-flags` (Redux-backed) and decouple from `@ledgerhq/live-common/featureFlags/*` + `@ledgerhq/types-live` for feature-flag types/constants.
