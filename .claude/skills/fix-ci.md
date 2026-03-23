# Fix CI

Find failing CI jobs, inspect logs, and apply focused fixes.

## Trigger

Branch CI is failing and needs a fast, iterative path to green checks.

## Workflow

1. Identify the latest run for the current branch:
   ```bash
   gh run list --branch $(git branch --show-current) --limit 1
   ```

2. Inspect failed jobs and extract the first actionable error:
   ```bash
   gh run view <run-id> --log-failed
   ```

3. Apply the smallest safe fix.

4. Push and re-run CI. Repeat until green.

## Guardrails

- Fix one actionable failure at a time.
- Prefer minimal, low-risk changes before broader refactors.
- Never use `--no-verify` or skip safety checks.

## Output

- Primary failing job and root error
- Fixes applied in iteration order
- Current CI status and next action
