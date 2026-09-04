---
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
"@ledgerhq/live-e2e-shared": minor
---

Remove dead code from the e2e test suites: page-object methods and locators with no callers are deleted, members used only inside their own class are made `private`, and symbols exported but only referenced in their own file lose the `export`. Two empty page classes left behind by the sweep (`portfolioEmptyState.page.ts`, `transferMenu.drawer.ts`) are removed along with their `Application` wiring.

Also fixes `e2e/mobile/scripts/typecheck.js`, which passed the raw `tsconfig.json` to `parseJsonConfigFileContent` and so never resolved the `extends` chain. It reported 466 phantom errors on a clean tree, which hid real ones — including the `app.<page>.<method>()` calls that break at runtime with `TypeError: ... is not a function` when a page-object method is deleted while a caller in `e2e/mobile/models/` remains. It now uses `getParsedCommandLineOfConfigFile` and reports clean.
