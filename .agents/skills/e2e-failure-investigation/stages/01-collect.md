# 01 Collect

Input: versioned investigation input, `STATE_DIR`. Output: `preflight.json`, `jobs.json`, `logs/<job_id>.log`.

1. Run `node scripts/preflight.mjs <input.json> $STATE_DIR/runs/<run_id>` before collection. Stop if its GitHub Actions availability is unavailable.
2. Run `scripts/collect.sh <run_id> $STATE_DIR/runs/<run_id>`. It uses read-only `gh` access to `LedgerHQ/ledger-live` by default.
3. Read `jobs.json`. If there are no failed jobs, follow the stage-06 short path.
4. Retry an empty or missing job log once. If it remains unavailable, add the job and access failure to output gaps.
5. Add the run to `runs/index.json`.
