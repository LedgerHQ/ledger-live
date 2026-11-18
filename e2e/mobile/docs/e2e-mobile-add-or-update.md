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

## Before writing

Read the product code behind each path the test takes, the page objects of the same client that may already declare your test ids, and the source of each helper you call, including one a review suggests. The rules: [product branches](../../docs/e2e-conventions.md#a-product-branch-must-follow-the-products-own-rule), [test-data ids](../../docs/e2e-conventions.md#test-data-ids-must-match-the-product-ids-they-select), [selectors](../../docs/e2e-conventions.md#selectors-must-live-on-the-page-object-that-renders-the-screen), [helpers](../../docs/e2e-conventions.md#a-helper-call-must-match-what-the-helper-does).

## Finishing

Follow [validate-before-finishing](../../../docs/validate-before-finishing.md), then:

- Review the diff against the [shared](../../docs/e2e-conventions.md) and [mobile](e2e-mobile-conventions.md) conventions, the ones Copilot applies.
- Run the spec you touched under degraded conditions, as described in [Before committing a test change](../README.md#before-committing-a-test-change).
- Run it on both platforms. Visibility and text input differ.
- After a product-code testID change, confirm the bundle rebuilt. `createBundleDetoxJsAndAssets` reports UP-TO-DATE despite edits under pnpm-symlinked `features/`, so a missing testID looks like a code bug when it is a stale bundle.
- Dispatch filtered mobile CI (`/run-e2e-ci`) and read Allure, not just the green check. A retry hides a failed first attempt.

Comments follow `/comments`. Keep only those recording a non-obvious reason.
