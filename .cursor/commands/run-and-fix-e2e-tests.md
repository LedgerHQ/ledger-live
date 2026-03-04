# Run and Fix E2E Tests

## Overview

Execute the Ledger Live Desktop E2E test suite and systematically fix any failures using the healer subagent. Follows the conventions in `.cursor/rules/e2e-conventions.mdc`.

## Write Boundary (CRITICAL)

- **ONLY** modify files under `e2e/desktop/` and `libs/ledger-live-common/src/e2e/`
- **NEVER** modify application source code under `apps/` — the only exception is adding `data-testid` attributes
- Follow POM, DRY, and SOLID principles — fixes go in the correct layer (page objects, not specs)

## Stage 0 — Build Prerequisite

Before running tests, ensure the Electron app is built in testing mode. If the build is stale or has never been run, execute the full build chain:

```bash
pnpm i                         # Install all monorepo deps
pnpm build:lld:deps            # Build LLD's internal dependencies
pnpm desktop build:testing     # Build the Electron app in testing mode
```

If source code under `apps/` was modified (e.g., adding `data-testid`), rebuild with `pnpm desktop build:testing` before running tests.

## Stage 1 — Run

Run all tests (or a specific spec if the user provides one). All `e2e/desktop` tests require `MOCK=0` (Speculos device simulator).

```bash
# All tests
MOCK=0 pnpm e2e:desktop test:playwright

# Specific spec
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<file>.spec.ts
```

**Important**: always use `MOCK=0` and the full path from workspace root (`e2e/desktop/tests/specs/<file>.spec.ts`).

Capture output and identify failures.

## Stage 2 — Analyze

For each failing test:
- Categorize by type: selector mismatch, timing issue, assertion failure, app regression, flaky
- Check if failures are related to recent changes (`git diff develop...HEAD`)
- Prioritize fixes based on impact

## Stage 3 — Heal

Use the `playwright-test-healer` subagent for each failing spec:

1. Invoke the healer with the failing spec path
2. The healer will:
   - Run `test_debug` to pause on errors
   - Capture page snapshots for context
   - Identify root cause (selector change, timing, data dependency, app change)
   - Apply fixes in the correct layer (locators in page objects, assertions in page object methods, flow in specs)
   - Re-run to verify the fix
3. After healing, re-run the full suite
4. Repeat up to **3 heal cycles**
5. If a test still fails after 3 cycles, mark it `test.fixme()` with an explanation

**Do not proceed to Stage 4 until all heal cycles are complete.**

## Stage 4 — CI Validation

Ensure all modified code passes CI checks.

1. Run lint on e2e code:

```bash
pnpm --filter ledger-live-desktop-e2e-tests lint
```

2. Run typecheck:

```bash
pnpm --filter ledger-live-desktop-e2e-tests typecheck
```

3. Fix any reported issues. Repeat until both pass.

**Do not proceed to Stage 5 until all CI checks pass.**

## Stage 5 — Verify (run tests 2x)

Run the tests **twice** to confirm they are stable and not flaky.

### Run 1 — Confirm all tests pass

```bash
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<file>.spec.ts
```

If any test fails, go back to Stage 3 (Heal), then redo Stage 4 (CI), then return here.

### Run 2 — Confirm stability (no flaky tests)

```bash
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<file>.spec.ts
```

If a test passes on Run 1 but fails on Run 2, it is **flaky** — fix or mark `test.fixme()`.

**Do not proceed to Stage 6 until both runs pass cleanly.**

## Known Pitfalls

When diagnosing failures, check for these common issues:

1. **Wallet 4.0 userdata fixture**: If `lwdWallet40` is enabled and the test uses `skip-onboarding`, the MVVM `Balance` component renders `NoDeviceView` instead of `BalanceView`. Switch to `skip-onboarding-with-last-seen-device`.

2. **Wallet 4.0 navigation**: With `mainNavigation: true`, sidebar links change. Tests should use `app.mainNavigation.openTargetFromMainNavigation(...)` instead of `app.layout.goTo*()`.

3. **Modular selector vs legacy modal**: Wallet 4.0 may use modular dialog/drawer for account operations. Use `getModularSelector()` to detect the active variant.

4. **Stale builds**: If `data-testid` was added to app source, `pnpm desktop build:testing` must be re-run or the test won't find the new testid.

5. **Full test paths**: Always use `e2e/desktop/tests/specs/<file>.spec.ts` (full path from workspace root).

## Stage 6 — Report

Provide a summary:
- Total specs run
- Passed / Failed / Skipped (`test.fixme`)
- Both Run 1 and Run 2 results
- Fixed tests: what was broken and how it was fixed
- Flaky tests: identified and resolved or marked `test.fixme`
- List all files modified
