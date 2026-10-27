# 06 Report

Input: preflight, facts, hypotheses, evidence, confidence, gaps and any approved ticket result. Output: `investigation.json`, `report.md`.

1. Write `investigation.json`, the versioned run-level wrapper that validates against `schemas/investigation-output.schema.json`. Include `preflight`, all `findings`, summary counts and every access/evidence gap. Each finding validates against `finding.schema.json`.
2. A `confirmed` finding needs evidence; a `known` finding needs a ticket; a `not_confirmed` finding needs attempts and user actions. Do not turn unavailable evidence into confirmation.
3. Write `report.md` with run/workflow/device/environment/SHA, a five-sentence summary, platform table, flaky tests, counts and gaps. State whether a Jira write was approved and made.
4. Add a Datadog table for every backend finding: cause, backend, run-environment result with numbers/link, and PRD result with numbers/link. For `not_checked`, state the reason.
5. Update `runs/index.json`.

## Short path

For `no_failures` or `no_domain_failures`, write the same `investigation.json` wrapper with an empty `findings` array, `summary.skipped`, and the required preflight. Write the short report and update `runs/index.json`.
