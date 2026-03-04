# Generate E2E Tests with Playwright

## Overview

One-shot pipeline that produces production-quality Playwright E2E tests for Ledger Live Desktop. Uses three specialized subagents (planner, generator, healer), the Atlassian MCP for Jira/Xray integration, and follows the conventions in `.cursor/rules/e2e-conventions.mdc`.

All generated code must follow POM, DRY, and SOLID principles. Tests are **only** written inside `e2e/desktop/`. Application source code under `apps/` is **never** modified except for adding `data-testid` attributes.

## Invocation

This command requires a Jira/Xray ticket. Two modes are supported:

### Mode 1 — Populated ticket (fetch spec from Jira)

```
/.generate-e2e-tests JIRA:<ticket>
```

Example: `/.generate-e2e-tests JIRA:B2CQA-2499`

The agent fetches the ticket description from Jira and uses it as the test specification.

### Mode 2 — Unpopulated ticket (inline spec)

```
/.generate-e2e-tests JIRA:<ticket> - not populated - <spec description here>
```

Example: `/.generate-e2e-tests JIRA:B2CQA-9999 - not populated - Test that adding an Ethereum account shows it in the portfolio with correct balance and operations`

The agent uses the inline description as the test specification and will update the Jira ticket with the final test description at the end.

**If no JIRA ticket is provided, stop and ask the user for one. Every test must be linked to an Xray ticket.**

## Stage 0 — Parse Input & Fetch Spec

### 0a. Extract the Jira ticket key

Parse the user input to extract the `JIRA:<key>` value (e.g., `B2CQA-2499`). This key will be used for:
- Fetching the test specification (Mode 1)
- TMS annotation in the generated test
- Updating the ticket after generation

### 0b. Get the Jira cloudId

Call the Atlassian MCP to get the cloudId:

```
MCP tool: getAccessibleAtlassianResources (server: user-Atlassian-MCP-Server)
```

Use the cloudId for `ledgerhq.atlassian.net` from the response.

### 0c. Fetch or use the test specification

**Mode 1** (populated ticket): Fetch the ticket details:

```
MCP tool: getJiraIssue (server: user-Atlassian-MCP-Server)
Arguments: { cloudId: "<cloudId>", issueIdOrKey: "<ticket-key>" }
```

Extract the ticket's **summary** and **description** as the test specification. If the description is empty or too vague to derive test steps, ask the user for clarification.

**Mode 2** (unpopulated ticket): Use the inline spec provided after `- not populated -`.

### 0d. Present the specification to the user

Display:
- Jira ticket key
- Test specification (from Jira or inline)
- Ask for confirmation before proceeding

**Do not proceed to Stage 1 until the user confirms.**

## Stage 1 — Plan

Use the `playwright-test-planner` subagent to explore the running application and produce a structured test plan based on the specification from Stage 0.

1. Invoke the planner subagent with:
   - The test specification extracted from the Jira ticket or inline description
   - The Jira ticket key for TMS annotation
   - Context about the Electron app and existing test coverage
2. The planner saves its output as a markdown plan
3. Read the generated plan and present a summary:
   - Number of test suites and scenarios
   - List of scenario names
   - Which `userdata` fixture and `speculosApp` each scenario needs

**Do not proceed to Stage 2 until Stage 1 is complete and the plan exists.**

## Stage 2 — Generate

Use the `playwright-test-generator` subagent to produce a raw spec file for each scenario in the plan.

1. Parse the plan to extract each scenario:
   - Suite name (e.g. "Add Accounts")
   - Scenario name (e.g. "[Ethereum] Add account")
   - Steps and expectations
   - Target file path in `e2e/desktop/tests/specs/`
2. For each scenario, invoke the `playwright-test-generator` subagent
3. After all generator invocations complete, read every generated spec file to confirm they exist

**Do not proceed to Stage 3 until all spec files are generated.**

## Stage 3 — Architect

Restructure the generated code into the Page Object Model defined in `.cursor/rules/e2e-conventions.mdc`. This stage is performed by the main agent (not a subagent).

### 3a. Review existing infrastructure

Check that existing page objects and fixtures cover the needed interactions. Do NOT recreate infrastructure that already exists.

### 3b. Add `data-testid` attributes (the ONLY allowed `apps/` modification)

Before creating page objects, ensure every element the tests need to locate has a `data-testid` attribute in the app source code. Search the generated raw specs for locator patterns and add missing testids to the corresponding React components in `apps/ledger-live-desktop/src/`.

When adding `data-testid` to components that accept spread props (`{...props}`), place `{...props}` **before** explicit attributes (`className`, `data-testid`) so the component's own testid cannot be accidentally overridden by a caller.

**This is the ONLY change allowed in `apps/`** — no logic, styling, or structural changes.

### 3c. Create or update page objects (DRY + SOLID)

Read all generated spec files and extract every locator and interaction pattern into page object classes:

- If an existing page object already covers the interaction, **reuse it** — do not duplicate
- If a new page/modal/drawer/dialog needs coverage, create a page object under `e2e/desktop/tests/page/`
- Private locators using `getByTestId` as primary strategy
- Public methods for actions (`click*`, `fill*`, `select*`) and assertions (`expect*`)
- Decorate every public method with `@step(...)`
- Shared cross-cutting interactions go in `tests/component/` base classes
- Follow single responsibility: one page object per page/view/modal/drawer

### 3d. Update Application facade

If new page objects were added, register them in `e2e/desktop/tests/page/index.ts` as public properties.

### 3e. Rewrite spec files

Rewrite every generated spec following conventions:

- Import `test` from `"tests/fixtures/common"` (never from `@playwright/test`)
- Use `app.<page>.<method>()` calls instead of raw locators — **no raw `page.getByTestId(...)` calls in specs**
- Include the **Jira ticket** in TMS annotation: `{ type: "TMS", description: "<ticket-key>" }`
- Call `addTmsLink(...)` at the start of each test
- Include device tags and currency/family tags
- Use data-driven patterns with `for...of` when testing multiple currencies
- Tests must be **deterministic** — no `if/else` branching based on runtime state

### 3f. Deduplicate (DRY)

- If multiple specs share the same setup sequence, ensure it lives in the page object or fixture, not duplicated across specs
- If multiple page objects share locators, use composition or a shared base class

## Stage 4 — Build & Heal

### 4a. Build the Electron app

Before running tests, the desktop app must be built in testing mode. Run the full build chain:

```bash
pnpm i                         # Install all monorepo deps
pnpm build:lld:deps            # Build LLD's internal dependencies
pnpm desktop build:testing     # Build the Electron app in testing mode
```

All three steps are mandatory. If any step fails, fix the issue before proceeding.

### 4b. Run and heal

Run all generated tests and fix failures using the `playwright-test-healer` subagent.

1. Run the full test suite for the generated specs:

```bash
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<file>.spec.ts
```

2. If any tests fail, invoke the `playwright-test-healer` subagent with the failing spec paths
3. After healing, re-run the tests
4. Repeat up to **3 heal cycles**
5. If a test still fails after 3 cycles, the healer marks it `test.fixme()` with an explanation

**Do not proceed to Stage 5 until all heal cycles are complete.**

## Stage 5 — CI Validation

Ensure all generated and modified code passes the project's CI checks.

1. Run lint on e2e code — if it fails, fix the reported issues (unused imports, formatting, etc.):

```bash
pnpm --filter ledger-live-desktop-e2e-tests lint
```

2. Run typecheck — if it fails, fix type errors in page objects and specs:

```bash
pnpm --filter ledger-live-desktop-e2e-tests typecheck
```

3. If any `data-testid` was added to `apps/ledger-live-desktop/src/`, also lint the desktop app:

```bash
pnpm --filter ledger-live-desktop lint
```

4. Repeat until all checks pass cleanly.

**Do not proceed to Stage 6 until all CI checks pass.**

## Stage 6 — Verify (run tests 2x)

Final validation pass. Run the generated tests **twice** to confirm they are stable and not flaky.

### Run 1 — Confirm all tests pass

```bash
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<file>.spec.ts
```

If any test fails on Run 1:
- Go back to Stage 4 (Heal) to fix
- Then re-do Stage 5 (CI Validation)
- Then return here

### Run 2 — Confirm stability (no flaky tests)

```bash
MOCK=0 pnpm e2e:desktop test:playwright e2e/desktop/tests/specs/<file>.spec.ts
```

If a test passes on Run 1 but fails on Run 2, it is **flaky**. Investigate and fix the root cause:
- Timing issues → add proper waits (`toBeVisible`, `waitFor`)
- State leakage → ensure test isolation via fixtures
- Race conditions → use assertion retries

Do **not** accept flaky tests. Fix or mark as `test.fixme()` with an explanation.

**Do not proceed to Stage 7 until both runs pass cleanly.**

## Stage 7 — Update Jira Ticket

After all tests pass both runs, update the Jira/Xray ticket with a clear description of what the test validates.

Call the Atlassian MCP:

```
MCP tool: editJiraIssue (server: user-Atlassian-MCP-Server)
Arguments: {
  cloudId: "<cloudId>",
  issueIdOrKey: "<ticket-key>",
  fields: {
    description: "<structured description of what the E2E test validates>"
  }
}
```

The description should include:
- **Test title** — the `test.describe` + `test(...)` name
- **Spec file** — path relative to `e2e/desktop/`
- **What is tested** — step-by-step summary of the test flow
- **Fixtures used** — userdata, speculosApp, cliCommands, featureFlags
- **Device tags** — which devices the test runs on
- **Mode** — Speculos (`MOCK=0`)

## Known Pitfalls

Before generating tests, be aware of these common issues:

1. **Wallet 4.0 userdata fixture**: When `lwdWallet40` is enabled, use `skip-onboarding-with-last-seen-device` instead of `skip-onboarding`. The MVVM `Balance` component requires `hasOnboardedDevice = true` to render `BalanceView` (which contains `portfolio-balance`). Without device info, it renders `NoDeviceView` and the test times out looking for `portfolio-balance`.

2. **Wallet 4.0 navigation**: With `mainNavigation: true`, sidebar navigation changes. Use `app.mainNavigation.openTargetFromMainNavigation("accounts")` instead of `app.layout.goToAccounts()`.

3. **Modular selector detection**: In Wallet 4.0, the "add account" flow may use a modular dialog/drawer. Use `getModularSelector(app, "ASSET")` to detect the variant and branch accordingly.

4. **Full test paths**: Always pass the full path from workspace root: `e2e/desktop/tests/specs/<file>.spec.ts`, not just `specs/<file>.spec.ts`.

5. **Build before test**: The Electron bundle must be built before tests can run. Always run the full build chain (`pnpm i`, `pnpm build:lld:deps`, `pnpm desktop build:testing`) in Stage 4a.

6. **Feature flag params**: `lwdWallet40` has multiple params (`marketBanner`, `graphRework`, `quickActionCtas`, `mainNavigation`). Each controls a different UI variant. Read the feature flag definition to understand which params affect the flow under test.

## Stage 8 — Report

Present the final results to the user:

1. **Test results** from both runs:
   - Total specs
   - Passed
   - Failed
   - Skipped (`test.fixme`)
2. **Jira ticket updated**: `https://ledgerhq.atlassian.net/browse/<ticket-key>`
3. **Files created or modified** (grouped by):
   - Spec files (`e2e/desktop/tests/specs/`)
   - Page objects (`e2e/desktop/tests/page/`)
   - Components (`e2e/desktop/tests/component/`)
   - Shared models (`libs/ledger-live-common/src/e2e/`)
   - `data-testid` additions (`apps/ledger-live-desktop/src/`)
