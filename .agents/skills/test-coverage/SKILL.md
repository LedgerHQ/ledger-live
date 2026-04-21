---
name: test-coverage
description: Increase test coverage to 90% on a target zone with iterative writing and refactoring
disable-model-invocation: true
---

# Test Coverage

Increase test coverage to 90% on a target zone with iterative writing and refactoring.

## Prompt Variables

$TARGET_ZONE

> Directory path or Jira ticket URL for the zone to cover (e.g., `src/mvvm/features/Accounts/` or `https://ledgerhq.atlassian.net/browse/LIVE-1234`)

## Instructions

Follow all conventions from the `testing` skill (`.agents/skills/testing/SKILL.md`).
Delegate test execution to the `test-runner` subagent throughout.

### Step 1: Scope and Analyze

1. If `$TARGET_ZONE` is a Jira URL, fetch the ticket via Atlassian MCP and extract affected files.
2. Use `code-explorer` subagent to analyze the zone: trace execution paths, map dependencies, and identify branching logic worth testing.
3. Measure current coverage:
   ```bash
   pnpm <mobile|desktop> test:jest --coverage \
     --collectCoverageFrom='<zone-glob>' \
     --coverageReporters=text-summary
   ```
4. From the `code-explorer` analysis, build the list of files to test. Skip type definitions, barrel re-exports, and thin wrappers with no branching.
5. For each remaining file, ask:
   - Does it contain **branching logic**, **state transitions**, or **side effects**?
   - Would a regression **break user-facing behavior**?
   - Is it already covered indirectly by a parent test?
     If all answers are no, skip.

### Step 2: Write Tests

Order: `pure utils -> hooks -> viewModels -> components with side effects`.

For each file:

1. **Search** existing mocks/fixtures/factories before creating new ones (see testing skill).
2. **Write tests** following all testing skill conventions.
3. **Run tests** via `test-runner`. Fix failures before moving to the next file.

Loop until coverage >= 90%.

### Step 3: Refactoring Loop

Three sequential passes. After **each** pass, run tests via `test-runner` -- they must still pass before the next pass.

**Pass 1 -- Audit mocks**

- For every mock (`jest.mock`, `jest.fn`, `mockReturnValue`, `jest.spyOn`): is it asserted directly or does it enable a code path whose **output** is asserted?
- Remove any mock that satisfies neither. Simplify over-specified mocks.

**Pass 2 -- Deduplicate**

- Scan all test files in the zone for repeated factories, inline fixtures, or mock setup blocks.
- Duplicated within one file -> extract a local helper.
- Duplicated across 2+ files -> move to nearest `__tests__/shared.ts`.
- Used in one file only -> keep local.

**Pass 3 -- Prune redundant tests**

- Two `it` blocks testing the same branch with trivially different inputs -> merge or remove.
- Tests that only assert a mock was called without verifying output or state -> strengthen or remove.
- Tests on logic-free getters (direct property access) -> remove.

### Step 4: Summary Report

Output a report covering:

- **Coverage**: before/after percentages
- **Tests written**: for each file, what behaviors were tested and why they are relevant
- **Remaining gaps**: files still below 90% and why
