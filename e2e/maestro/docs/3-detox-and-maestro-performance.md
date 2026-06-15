# Detox and Maestro - Performance

Comparing execution time for **Detox** and **Maestro** (POC
`feat/qaa-1242-poc-maestro`).

> ⚠️ **Numbers below are a measurement template, not results.** The Maestro POC ships a single swap spec
> and has not been benchmarked head-to-head in CI yet. Cells marked `TBD` must be filled from matched CI
> runs (see _Methodology_). The _Architectural expectations_ section states what we predict and **why**,
> so the measured numbers can be sanity-checked against the design.

## Environment and coverage

Mirror the Detox/WDIO performance setup for a like-for-like comparison.

Coverage:

- Swap journey: open app → deeplink swap → select to/from → execute swap
- Various account and token combinations
- Some with network selection and some without

CI environment:

| **Environment**  | **Android**                     | **iOS**                                            |
| ---------------- | ------------------------------- | -------------------------------------------------- |
| Speculos         | Local (docker)                  | Remote                                             |
| Device count     | 1 device per runner             | 1 device per runner                                |
| Device resources | 4 cores, 6 GB RAM, GPU `auto`   | iPhone 16 sim — **iOS ≤ 18.x required** (see note) |
| Test workers     | Single (POC has no sharding)    | Single (POC has no sharding)                       |
| Test runner      | Maestro CLI driven by `ts-node` | Maestro CLI driven by `ts-node`                    |

> **iOS note:** Maestro can only read the swap WebView on **iOS ≤ 18.x**. iOS perf must therefore be
> measured on an **old** simulator runtime — it is **not representative of user devices**, and on iOS 26
> the swap flow does not run at all. Treat iOS Maestro numbers as a lower-bound feasibility check, not a
> production figure.

## Methodology

To make Maestro comparable to the existing Detox/WDIO comparison:

1. Run Detox and Maestro back-to-back on the **same runner type** with the **same Speculos** and the same
   swap matrix.
2. Record from Allure: per-test fastest/slowest/average, suite duration, failures, retries.
3. Repeat ≥3 times (as the Detox/WDIO comparison did) to average out swap-provider flakiness
   (`swapsxyz` timeouts were infra, not framework).
4. Capture Maestro-specific timings the POC already logs: `time - flow[<name>]`, and the `timed(...)`
   spans (`speculos-start`, `bridge-start`, `app-launch`, `bridge-ready`, `swap-input-amount`).

## Comparison (template — fill from CI)

| **Builds under comparison: Detox** `#TBD` **· Maestro** `#TBD` |
| -------------------------------------------------------------- |

| **Metric**                   | **Android Detox** | **Android Maestro** | **iOS Detox** | **iOS Maestro (iOS ≤18)** |
| ---------------------------- | ----------------- | ------------------- | ------------- | ------------------------- |
| **Report**                   | TBD               | TBD                 | TBD           | TBD                       |
| **Stability** (fail/retries) | TBD               | TBD                 | TBD           | TBD                       |
| **Per-test** (fast/slow/avg) | TBD               | TBD                 | TBD           | TBD                       |
| **Suite duration**           | TBD               | TBD                 | TBD           | TBD                       |
| **Notes**                    |                   |                     |               |                           |

(Reference point: the Detox/WDIO page measured Detox Android per-test ≈ **2m 41s avg**, iOS ≈ **1m 37s
avg**, Android suite ≈ **40m**, iOS suite ≈ **27m**. Use those as the Detox baseline if re-running is not
possible.)

## Architectural expectations (what to predict and why)

- **Per-flow process spawn is Maestro's fixed cost.** Each `ctx.runFlow()` spawns a `maestro` CLI
  process (JVM + driver init). The POC batches commands into one flow per logical step to amortize this
  (see _Maestro - optimise flow batching_), and reuses the driver with `--no-reinstall-driver` after the
  first flow. **Expect** a per-spec startup overhead Detox/Jest does not pay per test; the fewer
  `runFlow` calls, the closer Maestro gets to Detox.

- **Android webview reads are heavier.** `androidWebViewHierarchy: devtools` makes Maestro query Chrome
  DevTools for the DOM on swap steps. **Expect** Android swap steps to be **slower** than Detox's native
  `by.web.*` DOM calls, not faster.

- **No app-state sync cuts idle waits.** Detox waits for app idle; Maestro does not. On our never-idle
  app this can **remove** dead time → **expect** native (non-webview) steps to be competitive or faster.

- **No sharding in the POC = slower full suite.** Detox shards across the suite; the POC runs one spec on
  one device. For the full ~108-case suite, Maestro would be **much slower** unless `maestro test
--shards N` (+ tags) or Maestro Cloud parallelism is wired in. This is a POC gap, not a Maestro limit.

- **iOS is feasibility-only.** Measured on iOS ≤18; not comparable to Detox running on current iOS.

## Expected summary (to confirm with data)

| Dimension               | Prediction                                                 | Confidence       |
| ----------------------- | ---------------------------------------------------------- | ---------------- |
| Android per-test (swap) | Maestro ≈ or **slower** than Detox (devtools webview read) | Medium           |
| Native-only flows       | Maestro **competitive/faster** (no idle wait)              | Medium           |
| iOS swap                | Only on iOS ≤18; **not** comparable to prod                | High             |
| Full suite wall-clock   | Maestro **slower** until sharding added                    | High             |
| Stability               | Native: Maestro ≥ Detox; webview/Speculos: ≤ Detox         | Low — needs data |

> **One-line (pending measurement):** Maestro's per-flow process spawn and DevTools webview read are
> likely to make the **swap** journey no faster (probably slower on Android) than Detox, while
> **native** flows should be competitive; the headline full-suite number depends entirely on adding
> sharding, which the POC does not yet have.
