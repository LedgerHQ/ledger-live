# Desktop E2E — userdata cache vs live account scan (benchmark)

Benchmark of the [`generate-e2e-userdata`](../../../.github/workflows/generate-e2e-userdata.yml)
pre-generated userdata cache against the current live-scan behaviour, measured on the
**[Desktop] - E2E Only - Scheduled/Manual** workflow
([`test-ui-e2e-only-desktop.yml`](../../../.github/workflows/test-ui-e2e-only-desktop.yml)).

The `generate-e2e-userdata` workflow scans every supported coin's accounts on Speculos once
per day and caches the resulting `app.json` userdata files to S3. When `generate_userdata=true`,
an E2E run restores that cache instead of scanning accounts live on Speculos at the start of the
job — which should remove a chunk of fixed startup cost from every run.

This page tracks the run times of both modes so we can decide whether to make the cache the
default for the desktop E2E pipeline.

---

## Setup

- **Workflow:** `.github/workflows/test-ui-e2e-only-desktop.yml`
- **Branch:** `feat/qaa-1285`
- **Commit:** `dd40e0b9`
- **Cohorts:** 3 runs each, triggered back-to-back via `workflow_dispatch`.
- **Variable:** the `generate_userdata` input flag
  - `true` → reuse the daily pre-generated `app.json` userdata cache (restored from S3).
  - `false` → scan accounts live on Speculos (current default behaviour / baseline).
- **Duration:** end-to-end run wall-clock (`created` → `completed` per the GitHub API,
  queue time included). Same method for every run, so the comparison is apples-to-apples.

---

## Results — cache ON (`generate_userdata=true`)

| #   | Run                                                                             | Conclusion | Duration |
| --- | ------------------------------------------------------------------------------- | ---------- | -------- |
| 1   | [27750688063](https://github.com/LedgerHQ/ledger-live/actions/runs/27750688063) | success    | 13m 31s  |
| 2   | [27751564893](https://github.com/LedgerHQ/ledger-live/actions/runs/27751564893) | success    | 13m 00s  |
| 3   | [27751572135](https://github.com/LedgerHQ/ledger-live/actions/runs/27751572135) | success    | 14m 44s  |

**Average: ~13m 45s** · min 13m 00s · max 14m 44s · all green.

---

## Results — cache OFF (`generate_userdata=false`, live Speculos scan)

| #   | Run                                                                             | Conclusion | Duration |
| --- | ------------------------------------------------------------------------------- | ---------- | -------- |
| 1   | [27755240605](https://github.com/LedgerHQ/ledger-live/actions/runs/27755240605) | ❌ failure | 22m 32s  |
| 2   | [27755246448](https://github.com/LedgerHQ/ledger-live/actions/runs/27755246448) | ❌ failure | 23m 03s  |
| 3   | [27755252090](https://github.com/LedgerHQ/ledger-live/actions/runs/27755252090) | ❌ failure | 23m 32s  |

**Average: ~23m 02s** · min 22m 32s · max 23m 32s · **0/3 green**.

All three failed identically at the **`Run Playwright E2E tests`** step (plus the separate,
`Experimental`-tagged **`Upload to qaa-allure (sandbox)`** step, which is an infra/upload job and
not part of the test run itself). The runs ran ~9 min _longer_ than the cached cohort before
failing — i.e. they completed the live account scan and ran the suite, rather than dying early.

---

## Summary

| Mode                                  | Avg duration | Runs           |
| ------------------------------------- | ------------ | -------------- |
| Cache ON (`generate_userdata=true`)   | **~13m 45s** | 3/3 ✅ success |
| Cache OFF (`generate_userdata=false`) | **~23m 02s** | 0/3 ❌ failure |

**Reusing the pre-generated userdata cache cut run time by ~9m 17s per run — roughly 40 % faster
(the live-scan runs took ~67 % longer).**

### Caveats

- **Not a pass-vs-pass comparison.** The cache-OFF cohort failed the Playwright step on all 3 runs
  while the cache-ON cohort was fully green. The time delta is directional, not a clean baseline.
- **Possible retry inflation.** Playwright retries failed tests, so the ~23m cache-OFF figure may be
  inflated by retries triggered by those failures; a fully-passing live-scan run could be somewhat
  faster than 23m.
- The consistent failure of the live-scan path (vs. green cached runs) is worth a root-cause look
  before drawing conclusions about whether the cache should become the pipeline default.
