# Test Coverage

Increase test coverage to 90% on a target zone with iterative writing and refactoring.

## Usage

`/test-coverage <directory-path>`

Example: `/test-coverage src/mvvm/features/Accounts/`

## Process

### Step 1: Scope and Analyze

1. Use `code-explorer` subagent to trace execution paths, map dependencies, and identify branching logic.
2. Measure current coverage:
   ```bash
   pnpm <mobile|desktop> test:jest --coverage \
     --collectCoverageFrom='<zone-glob>' \
     --coverageReporters=text-summary
   ```
3. Build the file list. Skip: type definitions, barrel re-exports, thin wrappers with no branching.
4. For each file, ask: Does it have branching logic, state transitions, or side effects? Would a regression break user-facing behavior?

### Step 2: Write Tests

Order: `pure utils → hooks → viewModels → components with side effects`

For each file:
1. Search existing mocks/fixtures/factories before creating new ones
2. Write tests following `CLAUDE.md` Testing Standards
3. Run via `test-runner`. Fix failures before moving on

Loop until coverage >= 90%.

### Step 3: Refactoring Loop (3 passes)

Run tests via `test-runner` after each pass.

**Pass 1 — Audit mocks**: Remove mocks that are neither directly asserted nor enable an asserted code path.

**Pass 2 — Deduplicate**: Extract repeated setup blocks to local helpers or `__tests__/shared.ts`.

**Pass 3 — Prune**: Merge trivially duplicated tests; remove tests that only assert mocks were called without verifying output.

### Step 4: Summary Report

- Coverage: before/after percentages
- Tests written: behaviors tested per file
- Remaining gaps: files below 90% and why
