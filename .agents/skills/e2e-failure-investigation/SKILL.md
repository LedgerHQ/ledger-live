---
name: e2e-failure-investigation
description: Investigate failed GitHub Actions E2E tests with read-only collection and structured, provider-neutral results. Use for Desktop Playwright or Mobile Detox failures.
---

# E2E Failure Investigation

Classify a failed E2E test as `bug` or `test_adjustment`, prove the cause where evidence permits, and report uncertainty. A domain pack in `domains/` controls filtering (Swap is currently available).

## Contract

Read `schemas/investigation-input.schema.json` before starting. The caller supplies a versioned JSON input containing the run, domain, state directory, optional adapter preferences, optional allowlisted secondary revisions, and `policy.jira_write_approved`. Do not infer write approval from any other input.

Write `preflight.json` first using `node scripts/preflight.mjs <input.json> <run_dir>`. It is required structured output documenting tool availability, selected adapter, detected environment (initially unknown), and policy. Update its environment fields after stage 02.

Write the final versioned wrapper to `investigation.json`, validated against `schemas/investigation-output.schema.json`. This is the canonical run-level output. `finding.schema.json` describes one entry in its `findings` array; it is not a schema for `findings.json`. `findings.json` is retired to remove the prior wrapper/schema mismatch.

A finding separates:
- **facts:** test identity, final retry-aware result, run/job/platform and verbatim observable error;
- **hypothesis:** `cause`, `cause_id`, verdict and area;
- **confidence:** `confirmed`, `known`, or `not_confirmed`;
- **evidence:** references and quotes that support the hypothesis;
- **gaps:** attempts and required user actions when it is not confirmed.

## Workspace and CI context

`LedgerHQ/ledger-live`, checked out at the failing workflow's exact `head_sha`, is always the primary workspace and evidence source. CI writes `investigation-context.json` into each failed E2E artifact; it identifies that immutable revision, the run/job URL, framework/platform, log pointer, and artifact directory/name. Download artifacts to an `artifacts/` directory beside the primary checkout and preserve this manifest.

Use the manifest's primary workspace first. Its artifact directory may contain screenshots, videos, Playwright traces, Detox output, JUnit/test-result JSON, and device logs; record each available pointer as evidence. Missing output is an evidence gap, not a reason to fabricate it.

The domain code map is a focused starting point, not an import boundary: follow relevant imports, fixtures, helpers, and shared libraries in `ledger-live`.

### Secondary repository routing

Do not clone repositories speculatively. Secondary repositories require a known revision in `secondary_repositories` and may be checked out as sibling directories only when the failure classification allows it:

- `LedgerHQ/swap-live-app`: embedded Swap UI, integration, or feature-configuration signal.
- `LedgerHQ/swap`: quote/provider/API/transaction-status signal, including backend `4xx`/`5xx`.
- Check out **both** only when the embedded UI contract is implicated; otherwise use only the matching repository.

When neither route is supported by evidence, report insufficient evidence or a likely external dependency. Do not invent a root cause.

## Runtime adapters and capabilities

- **GitHub Actions:** the built-in adapter is the `gh` CLI/API. It can read run metadata, jobs, logs and artifacts when the active `gh` token allows it. It must never rerun, trigger or modify a workflow.
- **Koda MCP:** this repository skill has no Koda MCP configuration or API contract. It neither detects nor invokes Koda. A host may provide it independently; preflight records it as unavailable unless the host supplies an adapter outside this skill.
- **Jira / attachments:** read-only GitHub collection is automatic. Any Jira write—including creating, commenting, linking, updating, or attaching—requires the caller to set `policy.jira_write_approved: true` for this investigation. Without it, do not invoke a write path; report the proposed action as a gap. A Jira search is read-only, but skip it unless needed by an explicitly approved ticket step.

## Stages

Run in order. Each stage reads prior state and writes its documented output.

1. `stages/01-collect.md`: failed jobs, logs, CI manifest and artifacts.
2. `stages/02-environment.md`: run environment.
3. `stages/03-extract.md`: failed tests and domain filtering.
4. `stages/04-analyze.md`: hypotheses, evidence, confidence and gaps.
5. `stages/05-ticket.md`: only with explicit Jira-write approval.
6. `stages/06-report.md`: canonical structured output and report.
7. `stages/07-digest.md`: user-facing digest.

If stage 01 has no failed jobs, or stage 03 has no domain failures, follow the short path in stage 06. A test that passes on retry is `flaky`; do not ticket it unless it shares a confirmed cause with a final failed test.

## State

- `runs/<run_id>/`: `preflight.json`, `jobs.json`, `logs/`, `artifacts/`, `investigation-context.json`, `environment.json`, `failures.json`, `investigation.json`, `report.md`, `digest.txt`.
- `runs/index.json`: analyzed run metadata.
- `causes.json`: cached cause/ticket history.

## Related skills

- `datadog-backend-check`: read-only confirmation of a configured backend symptom. If configuration, credentials, or access are absent, record that gap; do not claim a result.
- `bug-ticket`: only after explicit approval in the input policy. Pass `allow_create: false` unless creation is separately approved.

## Extending domains

Copy `domains/_template.json` to `domains/<name>.json`, add `domains/<name>.md` for causal chains, and keep backend names aligned with `datadog-backend-check` configuration.
