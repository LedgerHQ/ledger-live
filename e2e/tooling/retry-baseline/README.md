# e2e/tooling/retry-baseline

Measures what E2E retries buy and cost on the `[Desktop] - E2E Only` and `[Mobile] - E2E Only`
workflows: how many tests a retry rescues, how many runs would fail with fewer retries, and how much
CI time and Allure data the retries take. Built for [QAA-1268](https://ledgerhq.atlassian.net/browse/QAA-1268);
run it again after a retry change to compare with the baseline.

Local tool, not run in CI. Needs `gh` (logged in), `python3` and `node`.

## Run

```bash
e2e/tooling/retry-baseline/run.sh 2026-08-10 2026-10-09 "$TMPDIR/retry-baseline"
```

Expect a few GB of downloads and about an hour for two months of runs. Re-running with the same
folder resumes. The headline numbers are printed at the end; the full results are in the folder:

| Path                                  | Content                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `out/summary.json`                    | Per platform and trigger (`branch`, `nightly`, `all`): rescue counts, what-if run results, retry time, Allure size |
| `out/runs_*.json`, `out/tests_*.json` | Per run and per test detail                                                                                        |
| `out/fix_top_n.json`                  | Passing branch runs 0 retries would lose after fixing the N worst tests first                                      |
| `export/*.json`                       | Datasets of the baseline dashboard linked from QAA-1268                                                            |

## How it measures

Each workflow run is read at its first attempt, so a run re-run by hand counts once.

- **Desktop**: the `allure-results` artifact keeps every attempt of every test, with timings and
  attachments. Video is captured on the last attempt only (`isLastRetry`), so lowering retries
  saves the earlier attempts' Allure data.
- **Mobile**: the shard logs. Each Detox attempt ends with Jest's `Time:` line, failed tests are the
  `●` lines, and the parser checks itself against Jest's own failure count. Raw mobile Allure
  results expire after 7 days, so mobile Allure size comes from the last week only.

A test is **rescued** when it fails its first attempt and passes a later one. A run **fails at N
retries** when one of its tests would not have passed within N retries. `red_R2` is today's result
(2 retries); `red_R1` and `red_R0` are the what-ifs.

## Caveats

- Desktop retry minutes add up the parallel Playwright workers; `tail_ext_*` is how much later the
  run finishes, which is the runner time.
- Mobile retried whole spec files until 28 Aug 2026 and only failing tests after, so mobile retry
  time only counts runs since then (`MOBILE_RETRIES_ONLY_FAILING_TESTS_SINCE` in `analyze.py`).
- Branch runs include failures from the branch's own code: compare the share of passing runs lost,
  not the overall failure rate.
