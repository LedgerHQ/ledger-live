# 04 Analyze

Input: `failures.json`, `environment.json`, domain pack and prior cause history. Output: structured finding drafts.

1. Preserve facts separately: test/file/line, job/platform/device, final retry-aware outcome, failing step, first observable error and log/artifact references.
2. Match the error to a domain signature. A match creates a hypothesis only; record `cause_id`, cause, verdict and area separately from facts.
3. Follow the code and log chain to the first failure. Search logs and network artifacts for shared `429`, `5xx`, `ECONNREFUSED` or timeout symptoms before grouping tests.
4. For every backend hypothesis—including Swap and provider backends—call `datadog-backend-check` with the run environment, the configured backend key, precise symptom/provider where applicable, failed-job time window, and `check_prd: true`. Record both results, their numbers and URLs. A missing service, credentials, or access is a gap, not negative evidence.
5. A backend cause is `confirmed` only when its run-environment Datadog result is `found`. The PRD result never changes that status; record it as production comparison evidence. If either check is `not_checked`, record its reason in gaps and do not claim Datadog confirmation.
6. Set confidence/status: `known` only with an existing ticket, `confirmed` only with evidence, otherwise `not_confirmed` with attempts and user actions.
7. Find regression history with read-only `gh run list`, `git log`, and PR diffs where available. Do not infer a cause from a title.
