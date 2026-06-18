# Mobile E2E — userdata cache vs live account scan (benchmark)

Benchmark of the [`generate-e2e-userdata`](../../../.github/workflows/generate-e2e-userdata.yml)
pre-generated userdata cache against the current live-scan behaviour, measured on the
**[Mobile] - E2E Only - Scheduled/Manual** workflow
([`test-mobile-e2e-reusable.yml`](../../../.github/workflows/test-mobile-e2e-reusable.yml)),
for **both iOS and Android**.

Same idea as the [desktop benchmark](../../desktop/docs/userdata-cache-benchmark.md): the
`generate-e2e-userdata` workflow scans every supported coin's accounts on Speculos once per day
and caches the resulting `app.json` userdata files to S3. When `generate_userdata=true`, each
Detox shard restores that cache (`e2e-userdata-mobile-<date>`) and reads accounts/addresses from
it instead of scanning accounts live on Speculos.

---

## Setup

- **Workflow:** `.github/workflows/test-mobile-e2e-reusable.yml`
- **Branch:** `feat/qaa-1285`
- **`tests_type`:** `iOS & Android` · **Speculos device:** `nanoX`
- **Cohorts:** 3 runs each (cache-ON gained a 4th via re-run → **4 ON / 3 OFF**), dispatched via `workflow_dispatch`.
- **Variable:** the `generate_userdata` input flag
  - `true` → reuse the daily pre-generated `app.json` userdata cache (restored from S3 per shard).
  - `false` → scan accounts live on Speculos (current default behaviour / baseline).

### How duration is measured

A mobile run does a lot more than run tests: it **builds** the iOS and Android apps (native + JS)
and boots simulators/emulators before any test executes. Those builds are cached by commit /
source hash, so they are roughly constant across runs and **dwarf** the per-test userdata setup
that the cache actually changes.

So two metrics are reported:

1. **Detox test phase (primary)** — per-platform wall-clock of the `iOS E2E Tests` /
   `Android E2E Tests` shard jobs (the phase where userdata setup happens). This isolates the
   cache effect.
2. **Whole-run wall-clock (secondary)** — `created` → `completed` for the whole workflow run,
   for reference only (dominated by build + queue).

> ⚠️ **Runs are serialized.** The workflow's `concurrency` group keys on branch + `tests_type` +
> filter (not `generate_userdata`) with `cancel-in-progress: false`, so runs in a cohort queue and
> execute one at a time. Also, the first run on this commit warms the JS build cache, inflating
> its whole-run time (not its Detox phase).

---

## Results — cache ON (`generate_userdata=true`)

| # | Run | Whole-run | iOS Detox | iOS shards | Android Detox | Android shards |
|---|-----|-----------|-----------|------------|---------------|----------------|
| 1 | [27759602964](https://github.com/LedgerHQ/ledger-live/actions/runs/27759602964) | 50m 54s | 43m 22s | ❌ 2/3 pass | 25m 53s | ❌ 11/12 pass |
| 2 | [27759608206](https://github.com/LedgerHQ/ledger-live/actions/runs/27759608206) (attempt 2) | — | 46m 41s | ❌ 2/3 pass | 27m 03s | ❌ 10/12 pass |
| 3 | [27769044300](https://github.com/LedgerHQ/ledger-live/actions/runs/27769044300) | — | 40m 17s | ✅ 3/3 pass | 26m 01s | ❌ 11/12 pass |
| 4 | [27759613587](https://github.com/LedgerHQ/ledger-live/actions/runs/27759613587) (attempt 3) | — | 39m 22s | ✅ 3/3 pass | 22m 00s | ✅ 12/12 pass |

> **Runs 1–3 failed, but not because of the cache; run 4 is fully green.** Builds cached, app
> built/launched, accounts loaded. The failing shards hit the usual mobile flakiness — live-app
> web-element timeouts in Buy/Sell & Swap (`crypto-amount-option-button` / `number-of-quotes` not found
> after 60s), app crashes during Swap/Send (`IllegalStateException` / Fabric `RuntimeException`), and
> Speculos infra errors (`Speculinho POST /acquire` HTTP 500) — all unrelated to `generate_userdata`.
> Run 4 (`27759613587`, attempt 3) passed **12/12 Android + 3/3 iOS green**, the cleanest ON sample.
> Detox-phase durations are the meaningful signal.

---

## Results — cache OFF (`generate_userdata=false`, live Speculos scan)

| # | Run | Whole-run | iOS Detox | iOS shards | Android Detox | Android shards |
|---|-----|-----------|-----------|------------|---------------|----------------|
| 1 | [27759630133](https://github.com/LedgerHQ/ledger-live/actions/runs/27759630133) | ~58m exec¹ | 50m 52s | ❌ 1/3 pass | 25m 22s | ❌ 11/12 pass |
| 2 | [27759619109](https://github.com/LedgerHQ/ledger-live/actions/runs/27759619109) (attempt 2) | — | 47m 28s | ❌ 2/3 pass | 26m 31s | ❌ 11/12 pass |
| 3 | [27759624456](https://github.com/LedgerHQ/ledger-live/actions/runs/27759624456) (attempt 2) | — | 48m 16s | ❌ 2/3 pass | 26m 12s | ✅ 12/12 pass |

> ¹ This run was **queued ~50 min behind ON #1** (created 12:32, started 13:22) and then **reused ON #1's
> build cache** (JS/native build skipped). So its whole-run wall-clock (1h49m) is mostly queue + is not
> comparable. Only the **Detox phase** is a fair ON-vs-OFF metric. Failures were the same flaky
> Buy/Sell/Swap web-element timeouts + Speculos `HTTP 500` infra — not cache-related.
>
> The originally-queued runs `27759608206`, `27759613587` (ON) and `27759619109`, `27759624456` (OFF)
> were **cancelled** before starting — the runs serialize (see Setup), so they are re-triggered one at
> a time as each previous run finishes.

### Read (final — ON n=4, OFF n=3)

| Phase | Cache ON avg | Cache OFF avg | Δ (cache benefit) |
|-------|--------------|---------------|-------------------|
| iOS Detox | ~42m 26s (n=4) | ~48m 52s (n=3) | **~6m 27s faster (~13%)** |
| Android Detox | ~25m 14s (n=4) | ~26m 02s (n=3) | **~47s (~3%) — within noise** |

> Cleanest single data point — the fully-green ON run `27759613587`: **iOS 39m 22s, Android 22m 00s**.
> All 3 OFF runs failed on the same flaky/infra shards (the failing iOS shard's retries inflate the iOS
> phase), so the iOS Δ is an **upper bound**. Unlike desktop (cache ON ~40% faster **and** green vs
> all-red), mobile shows a **modest iOS gain (~6½ min) and effectively no Android gain** — build/queue
> time dominates the mobile pipeline and isn't affected by `generate_userdata`.

---

## Summary

Measured on the **E2E (Detox) phase only** — build/queue time is excluded because `generate_userdata`
doesn't affect it (and on mobile it dominates the wall-clock). Samples: **4 cache-ON, 3 cache-OFF**.

### iOS

| Mode | Avg Detox phase | Runs |
|------|-----------------|------|
| Cache ON | **~42m 26s** | 4 — 43m22s, 46m41s, 40m17s, 39m22s |
| Cache OFF | **~48m 52s** | 3 — 50m52s, 47m28s, 48m16s |

### Android

| Mode | Avg Detox phase | Runs |
|------|-----------------|------|
| Cache ON | **~25m 14s** | 4 — 25m53s, 27m03s, 26m01s, 22m00s |
| Cache OFF | **~26m 02s** | 3 — 25m22s, 26m31s, 26m12s |

**Time saved by the cache (iOS / Android): ~6m 27s (~13%) / ~47s (~3%, within noise).**

### Verdict

- **iOS:** the cache gives a **modest ~6½-minute speed-up (~13%)** on the Detox phase — but every OFF
  run had a failing iOS shard whose retries inflate the OFF time, so this is an **upper bound**; the
  real saving is likely smaller.
- **Android:** **no meaningful benefit** (~47s, inside run-to-run noise).
- **Not a reliability lever on mobile.** Unlike desktop (where cache-OFF runs couldn't even finish), the
  mobile live scan works fine with the cache off; all failures here were unrelated flaky Buy/Sell /
  Swap / Speculos-`HTTP 500` issues, in **both** cohorts (ON had the only fully-green run, `613587`).
- **Bottom line:** on mobile the userdata cache is a **nice-to-have (small iOS gain), not the major win
  it is on desktop** — mobile total time is dominated by build + queue, which the cache doesn't touch.
