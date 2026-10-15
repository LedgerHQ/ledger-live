# Adding or updating a mobile E2E test

Machine setup and run commands: the [README](../README.md) and `/e2e-mobile-onboard`.

## Where files go

| What                                         | Path                                   |
| -------------------------------------------- | -------------------------------------- |
| Spec — test scope and metadata only          | `specs/<domain>/<scenario>.spec.ts`    |
| Test function — the flow, flags, fixture     | `specs/<domain>/<domain>.ts`           |
| Screen page object                           | `page/<area>/<screen>.page.ts`         |
| Drawer / bottom sheet                        | `page/<area>/<name>.drawer.ts`         |
| App state fixture                            | `userdata/<name>.json`                 |
| Test data builder shared with desktop        | `libs/live-e2e-shared/src/<domain>.ts` |

Register each top-level page object in [`page/index.ts`](../page/index.ts) with `lazyInit` and a getter, so specs reach it as `app.<name>`. Composed child pages and drawers remain properties of their owning page object.

## Finishing

Follow [validate-before-finishing](../../../docs/validate-before-finishing.md), then:

- Run the spec you touched under degraded conditions, as described in [Before committing a test change](../README.md#before-committing-a-test-change).
- Run it on both platforms. Visibility and text input differ.
- After a product-code testID change, confirm the bundle rebuilt. `createBundleDetoxJsAndAssets` reports UP-TO-DATE despite edits under pnpm-symlinked `features/`, so a missing testID looks like a code bug when it is a stale bundle.
- Dispatch filtered mobile CI (`/run-e2e-ci`) and read Allure, not just the green check. A retry hides a failed first attempt.

Comments follow `/comments`. Keep only those recording a non-obvious reason.
