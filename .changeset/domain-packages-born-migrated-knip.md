---
"@domain/api-currency-fiat": minor
"@domain/api-currency-token": minor
"@domain/entity-currency": minor
"@domain/entity-currency-crypto": minor
"@domain/entity-currency-fiat": minor
"@domain/entity-currency-token": minor
"@domain/entity-currency-unit": minor
"@shared/schema-primitives": minor
"@shared/feature-flags": minor
"@features/flow-market-banner": minor
"@features/platform-feature-flags": minor
---

chore: make new domain/shared/features packages "born migrated" for knip

Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).
