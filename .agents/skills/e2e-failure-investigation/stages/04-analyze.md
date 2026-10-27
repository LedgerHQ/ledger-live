# 04 Analyze

Input: `failures.json`, `environment.json`, CI manifest/artifacts, domain pack and prior cause history. Output: structured finding drafts.

1. Preserve facts separately: test/file/line, job/platform/device, final retry-aware outcome, failing step, first observable error, run URL/id, and log/artifact references.
2. Start in `LedgerHQ/ledger-live` at `investigation-context.json`'s exact primary revision. Use the domain pack's key files as a focused code map, then follow relevant imports, fixtures, helpers, and shared libraries when evidence requires it.
3. Match the error to a domain signature. A match creates a hypothesis only; record `cause_id`, cause, verdict and area separately from facts.
4. Follow the code and log chain to the first failure. Search logs and network artifacts for shared `429`, `5xx`, `ECONNREFUSED` or timeout symptoms before grouping tests.
5. For every backend hypothesis—including Swap and provider backends—call `datadog-backend-check` with the run environment, the configured backend key, precise symptom/provider where applicable, failed-job time window, and `check_prd: true`. Record both results, their numbers and URLs. A missing service, credentials, or access is a gap, not negative evidence.
6. A backend cause is `confirmed` only when its run-environment Datadog result is `found`. The PRD result never changes that status; record it as production comparison evidence. If either check is `not_checked`, record its reason in gaps and do not claim Datadog confirmation.
7. Route to an optional sibling checkout only when supported by evidence and a known input revision: `swap-live-app` for embedded UI/integration/feature configuration, `swap` for quote/provider/API/transaction status or backend `4xx`/`5xx`; use both only for an implicated UI contract. Never clone unrelated repositories.
8. Set confidence/status: `known` only with an existing ticket, `confirmed` only with evidence, otherwise `not_confirmed` with attempts and user actions. If the evidence supports neither code path, report insufficient evidence or likely external dependency.
9. Find regression history with read-only `gh run list`, `git log`, and PR diffs where available. Do not infer a cause from a title.
