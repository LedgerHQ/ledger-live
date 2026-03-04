# Update E2E Tests After Codebase Changes

## Overview

Systematic pipeline that updates existing Playwright E2E tests after Ledger Live Desktop source code has changed. Detects affected page objects and specs, applies targeted updates, and validates everything passes. Follows the conventions in `.cursor/rules/e2e-conventions.mdc`.

## Write Boundary (CRITICAL)

- **ONLY** modify files under `e2e/desktop/` and `libs/ledger-live-common/src/e2e/`
- **NEVER** modify application source code under `apps/` — the only exception is adding `data-testid` attributes
- Follow POM, DRY, and SOLID principles throughout

## Stage 0 — Build & Baseline Run

### 0a. Build the Electron app

Before running tests, ensure the desktop app is built in testing mode:

```bash
pnpm i                         # Install all monorepo deps
pnpm build:lld:deps            # Build LLD's internal dependencies
pnpm desktop build:testing     # Build the Electron app in testing mode
```

### 0b. Run the baseline

Run the e2e test suite before making any changes to establish which tests are currently passing.

1. Run the relevant e2e tests:

```bash
MOCK=0 pnpm e2e:desktop test:playwright
```

2. Record the results as the **baseline**:
   - Total specs
   - Passed
   - Failed (list failing spec paths and error summaries)
   - Skipped (`test.fixme`)
3. Present the baseline to the user. Any failures found here are **pre-existing** and must be distinguished from regressions introduced by code changes.

**Do not proceed to Stage 1 until the baseline run is complete and results are presented.**

## Stage 1 — Detect Changes

Identify what changed in the application source since the base branch.

1. Run a diff against the base branch to find modified source files:

```bash
git diff develop...HEAD --name-only -- apps/ledger-live-desktop/src/
```

2. Also check for changes in shared e2e infrastructure:

```bash
git diff develop...HEAD --name-only -- libs/ledger-live-common/src/e2e/
git diff develop...HEAD --name-only -- e2e/desktop/
```

3. Categorize each changed file:
   - **Component / UI changes** — modified or removed `data-testid` attributes, renamed elements, changed layout
   - **Flow changes** — altered user flows (form logic, navigation, validation)
   - **Shared e2e changes** — modified Currency, Account, Transaction enums or Speculos families
   - **Page object changes** — directly modified test infrastructure
   - **Styling-only changes** — CSS changes with no structural impact (rarely affect tests)
4. Present a summary to the user

**Do not proceed to Stage 2 until the change summary is presented.**

## Stage 2 — Map Impact

Cross-reference the detected changes against the existing E2E test codebase.

1. Scan all page objects in `e2e/desktop/tests/page/` and `e2e/desktop/tests/component/` for locators that reference changed elements
2. Scan all specs in `e2e/desktop/tests/specs/` for flows that exercise changed features
3. Produce an **impact report**:
   - **Page objects to update** — locator mismatches, removed elements, renamed testids
   - **Specs to update** — changed user flows, new/removed steps, changed assertions
   - **New page objects needed** — if new pages, dialogs, or drawers were introduced
   - **Shared model updates** — if Currency, Account, or Transaction enums changed
   - **No impact** — changed files that do not affect any existing test
4. Present the impact report

**Do not proceed to Stage 3 until the impact report is reviewed.**

## Stage 3 — Update Page Objects & Specs

Apply targeted updates following `.cursor/rules/e2e-conventions.mdc`.

### 3a. Update page object locators and methods

- Rename locator fields to match renamed testids
- Remove locators for elements that no longer exist
- Add new locators and interaction/assertion methods for new elements
- Keep locators private; keep action and assertion methods public
- Preserve `@step(...)` decorators on all public methods

### 3b. Update specs

- Adjust test steps to match changed flows
- Update `test.use({...})` fixture configurations if needed
- Ensure data-driven test arrays are up to date
- Maintain device tags and TMS annotations

### 3c. Add new page objects (if needed)

If a new page, dialog, or drawer was introduced:
- Create a page object class following the POM pattern
- Register it in `tests/page/index.ts`

### 3d. Update shared models (if needed)

If new currencies or accounts are needed:
- Add to `libs/ledger-live-common/src/e2e/enum/Currency.ts`, `Account.ts`, etc.
- Add Speculos family signing flows if needed

### 3e. Remove dead code

- Delete page object methods and locators that are no longer referenced
- Remove unused imports

## Stage 4 — Heal

Run the affected tests and fix failures using the `playwright-test-healer` subagent.

1. If any source code was changed (including `data-testid` additions), rebuild first:

```bash
pnpm desktop build:testing
```

2. Run the e2e tests:

```bash
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<affected-file>.spec.ts
```

3. If any tests fail, invoke the `playwright-test-healer` subagent with the failing spec paths
4. After healing, re-run the tests
5. Repeat up to **3 heal cycles**
6. If a test still fails after 3 cycles, mark it `test.fixme()` with an explanation

**Do not proceed to Stage 5 until all heal cycles are complete.**

## Stage 5 — CI Validation

Ensure all modified code passes CI checks.

1. Run lint on e2e code:

```bash
pnpm --filter ledger-live-desktop-e2e-tests lint
```

2. Run typecheck:

```bash
pnpm --filter ledger-live-desktop-e2e-tests typecheck
```

3. If any `data-testid` was added to `apps/ledger-live-desktop/src/`, also lint the desktop app:

```bash
pnpm --filter ledger-live-desktop lint
```

4. Fix any reported issues. Repeat until all checks pass.

**Do not proceed to Stage 6 until all CI checks pass.**

## Stage 6 — Verify (run tests 2x)

Final validation pass. Run the affected tests **twice** to confirm stability.

### Run 1 — Confirm all tests pass

```bash
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<affected-file>.spec.ts
```

If any test fails, go back to Stage 4 (Heal), then redo Stage 5 (CI), then return here.

### Run 2 — Confirm stability (no flaky tests)

```bash
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<affected-file>.spec.ts
```

If a test passes on Run 1 but fails on Run 2, it is **flaky** — fix or mark `test.fixme()`.

**Do not proceed to Stage 7 until both runs pass cleanly.**

## Known Pitfalls

When updating tests, be aware of these common issues:

1. **Wallet 4.0 userdata fixture**: If `lwdWallet40` is enabled and a test uses `skip-onboarding`, the MVVM `Balance` component renders `NoDeviceView` instead of `BalanceView`. Switch to `skip-onboarding-with-last-seen-device`.

2. **Wallet 4.0 navigation**: With `mainNavigation: true`, sidebar links change. Tests should use `app.mainNavigation.openTargetFromMainNavigation(...)` instead of `app.layout.goTo*()`.

3. **Modular selector vs legacy modal**: Wallet 4.0 may use modular dialog/drawer for account operations. Use `getModularSelector()` to detect the active variant.

4. **Stale builds**: After adding `data-testid` to app source, always rebuild (`pnpm desktop build:testing`) before running tests.

5. **Full test paths**: Always use `e2e/desktop/tests/specs/<file>.spec.ts` (full path from workspace root).

## Stage 7 — Report

1. Compare results against the **Stage 0 baseline**:
   - New failures = regressions (must be fixed or explained)
   - Pre-existing failures = unchanged (document as known issues)
   - Newly passing tests = improvements
2. Report:
   - Total specs / Passed / Failed / Skipped
   - Both Run 1 and Run 2 results
3. List all files modified during the pipeline
