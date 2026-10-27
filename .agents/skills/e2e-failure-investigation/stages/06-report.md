# 06 Report

Input: findings with tickets. Output: `findings.json`, `report.md`.

1. Write `findings.json`. It must pass `schemas/finding.schema.json`. A `confirmed` finding has evidence, a `known` finding has a ticket, and a `not_confirmed` finding has `attempts` and `user_actions`.
2. Write `report.md`:
   - Run, workflow, device, environment, head SHA.
   - Summary in five sentences or fewer: the main causes.
   - One table, grouped by platform, then cause: test, verdict, area, status, ticket.
   - A "Datadog" table for every finding with `area: backend`: cause, backend, run environment result with numbers and link, PRD result with numbers and link. If a check did not run, write `not checked` and the reason.
   - Flaky tests, listed apart.
   - Counts: failed, flaky, left out by the filter.
   - Open items: every `user_actions` entry.
3. Update `runs/index.json` with the result.

## Short path

If there is nothing to analyze, stage 01 or 03 sends you here. Do not run the other stages.

1. Write `findings.json` as `{ "run_id": <id>, "skipped": "<no_failures or no_domain_failures>", "left_out": <count>, "findings": [] }`. For `no_failures`, set `left_out` to 0.
2. Write `report.md` with the run header: workflow, branch and head SHA. If `environment.json` exists, add the environment. Then add one sentence with the reason and the `left_out` count. Add no table.
3. Update `runs/index.json`, then go to stage 07.
