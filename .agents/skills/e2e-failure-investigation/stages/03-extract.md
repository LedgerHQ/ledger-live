# 03 Extract

Input: `jobs.json`, `logs/`, `domains/<domain>.json`. Output: `failures.json`.

1. Run `node scripts/extract-failures.mjs $STATE_DIR/runs/<run_id>`. Each row has `outcome`: `failed` or `flaky`.
2. Check the count. For Playwright, the totals must match the "N failed" and "N flaky" lines in the log.
3. Keep rows that match `test_filter` of the domain (spec file glob, tag, or title). Also keep rows that match `include_when_shared_cause` once stage 04 finds a shared cause.
4. Count the rows that were left out. Put the number in `report.md`.
5. Do not drop a row because it looks unrelated. Drop it only by the filter.
6. If no row matches `test_filter` (failed or flaky), skip stages 04 and 05. Go to stage 06 with `skipped: "no_domain_failures"` and `left_out` set to the count from step 4. A row that matches only `include_when_shared_cause` does not count, because no shared cause exists without a domain failure.
