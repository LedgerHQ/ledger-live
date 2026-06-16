---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
---

Make `@ledgerhq/live-common` a source-consumed (noop-build) package, like `@shared/*`, `@domain/*` and `@features/*`.

Its `build` is now a no-op (`nx:noop`), `exports`/`typesVersions` resolve to the TypeScript `src` directly, and the composite/emit tsconfig was removed. The desktop rspack renderer now transpiles `libs/ledger-live-common/src`. Apps and tests consume the source instead of a built `lib-es`, so the live-common build step is no longer required. No runtime behavior change.
