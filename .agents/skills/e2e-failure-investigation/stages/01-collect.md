# 01 Collect

Input: `run_id`, `STATE_DIR`. Output: `jobs.json`, `logs/<job_id>.log`.

1. Run `scripts/collect.sh <run_id> $STATE_DIR/runs/<run_id>`. It needs `gh` access to `LedgerHQ/ledger-live`.
2. Read `jobs.json`. If the run has no failed jobs, skip stages 02 to 05. Go to stage 06 with `skipped: "no_failures"`.
3. If a log is empty or missing, retry once. If it stays empty, put the job in `user_actions`.
4. Add the run to `runs/index.json`.
