# 01 Collect

Input: versioned investigation input, `STATE_DIR`. Output: `preflight.json`, `jobs.json`, `logs/<job_id>.log`, `artifacts/`, `investigation-context.json`.

1. Run `node scripts/preflight.mjs <input.json> $STATE_DIR/runs/<run_id>` before collection. Stop if its GitHub Actions availability unavailable.
2. Run `scripts/collect.sh <run_id> $STATE_DIR/runs/<run_id>`. It uses read-only `gh` access to `LedgerHQ/ledger-live` by default.
3. Download only artifacts from failed E2E jobs to `$STATE_DIR/runs/<run_id>/artifacts/`, then locate and copy each `investigation-context.json` to the run directory. The manifest's `primary_workspace.revision` is the exact `ledger-live` revision to check out; do not use the skill's revision or a branch tip instead.
4. Read `jobs.json` and the manifest. Record run URL/id, failed test/suite, log line pointers, and available screenshots, videos, Playwright traces, JUnit/test-result output, and device logs. Missing logs or artifacts are gaps.
5. If no failed jobs, follow stage-06 short path.
6. Retry an empty or missing job log once. If it remains unavailable, add job and access failure-output gaps.
7. Add run `runs/index.json`.
