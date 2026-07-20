---
"@ledgerhq/live-env": minor
---

Exports `injectDefinitions()`, all parser functions, and adds a `state.ts` module with `globalThis`-based env state management.

The new `@shared/live-env` workspace-private package uses these exports to call `injectDefinitions(allDefinitions)` at module load, providing a fully typed env API with ~200 vars organized by team. Consumers that still import from `@ledgerhq/live-env` directly are unaffected.
