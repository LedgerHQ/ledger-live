# e2e/tooling/startup-perf

Compares the startup time of two Ledger Wallet Mobile builds, A and B, on two Android emulators or
two iOS simulators. It automates the manual checks B2CQA-6555 (iOS) and B2CQA-6593 (Android).
[test-mobile-startup-perf.yml](../../../.github/workflows/test-mobile-startup-perf.yml) runs it in
CI only. The scripts run on Node alone (the `package.json` only holds the checks' tools). The build
jobs check out `ci/` alone, so the measured ref's Nx never sees a second copy of this package; the
measure jobs check out this folder, `e2e/mobile/userdata` and, on Android, `tools/scripts` and the
signing keystore.

`ci/` holds what the plan, build and Slack jobs run, from a checkout of `ci/` alone and, in the
build jobs, with the measured ref's Node (24.14 or later from `live-mobile@4.26.0` on): it never
imports from `src/` (`src/` may import from `ci/`), and its scripts are `.mts` so Node runs them as
ES modules without the `package.json`. `devices/` holds the shell the measure jobs run to get the
emulators or simulators and Maestro ready, `src/` the two programs (`measure/` writes
`samples.jsonl`, `analysis/` reads it), and `flows/` the Maestro flows. Each test sits next to its
module.

| Path                                | Role                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `ci/resolve-refs.mts`               | The plan job: resolves refs A and B to commits, branches and tags only                      |
| `ci/prepare-build.mts`              | Makes the checked-out ref's E2E prerelease build prod-like, before `e2e:build`              |
| `ci/verify-build.mts`               | Checks the built binary: no `MOCK`/`DETOX`, `FORCE_DEBUG_VISIBLE=1`, real blur              |
| `ci/slack-report.mts`               | The Slack job: the run's result from the jobs and each `summary.json`                       |
| `ci/step.mts`                       | What those share: workspace paths, error annotations, job summary, failing verdicts         |
| `devices/boot-emulators.sh`         | Boots the two Android emulators: 4 cores, animations on, cellular, idle                     |
| `devices/boot-simulators.sh`        | Creates and boots the two simulators, then waits for an idle host                           |
| `devices/install-maestro.sh`        | Installs the pinned Maestro, checked against its SHA-256                                    |
| `devices/wait-for-idle-host.sh`     | Waits for the iOS host's load to fall below its CPU count after the simulators boot         |
| `src/types.ts`                      | `Sample`: a line of `samples.jsonl`, which `measure/` writes and `analysis/` reads          |
| `src/measure/run.ts`                | The CLI that measures: installs, injects and launches A and B, writes `samples.jsonl`       |
| `src/measure/platforms/`            | `android.ts` and `ios.ts`, the two `Platform`s, through adb or simctl                       |
| `src/measure/startup-log.ts`        | Reads App startup time and the startup events from the app's `[startup]` log lines          |
| `src/measure/performance-screen.ts` | Reads them on the Debug screen through Maestro: warm-ups, and launches without the lines    |
| `src/measure/inject.ts`             | Imports a scenario's userdata through the E2E bridge, once per install                      |
| `src/measure/bridge.ts`             | The E2E bridge protocol (`apps/ledger-live-mobile/src/e2e/bridge/client.ts`)                |
| `src/measure/maestro.ts`, `exec.ts` | Maestro and child-process calls                                                             |
| `src/analysis/analyze.ts`           | The CLI that judges: pairs A and B, tells which start each Debug value counts from, verdict |
| `src/analysis/stats.ts`             | Median, Hodges–Lehmann with its Wilcoxon interval, bootstrap mean, uneven-phase widening    |
| `src/analysis/report.ts`            | The job summary: B − A per platform, scenario and measure                                   |
| `src/analysis/fake-samples.ts`      | Fake launches for the analysis tests                                                        |
| `flows/`                            | Maestro flows that open Settings > Debug > Performance in the running app                   |

## Presets

| Preset             | A                              | B                          | Fails when                        |
| ------------------ | ------------------------------ | -------------------------- | --------------------------------- |
| `prod-vs-release`  | latest `live-mobile@X.Y.Z` tag | `release` branch           | B is slower by > threshold_ms     |
| `prod-vs-develop`  | latest `live-mobile@X.Y.Z` tag | `develop` or `ref_b`       | same                              |
| `custom`           | any branch or tag              | any branch or tag          | same                              |
| `aa-noise`         | one build                      | the same binary            | only on `Not enough pairs`        |
| `known-regression` | this branch or `ref_a`         | A with LIVE-36190 re-added | B is not slower by > threshold_ms |

`aa-noise` reports how finely the setup resolves B − A. `known-regression` shows whether the gate
still catches LIVE-36190 on today's code: B no longer saves the trustchain at start, so every launch
generates its keypair again, the cost #21001 removed (its other half, a zod check of the keypair, no
longer exists).

Every weekday at 03:17 UTC the workflow runs `prod-vs-develop` with the settings of `NIGHTLY` in
`ci/resolve-refs.mts` (both platforms and scenarios, 20 pairs, 100 ms), as a scheduled run has no
inputs; the plan job passes the settings on to the other jobs. Its result is posted to
#live-repo-health, passed or failed: each platform and scenario's verdict and B − A, or why it has
none (a build that did not finish, a measurement that timed out). A dispatch posts there too when
`slack_notif` is ticked. A run cancelled by hand posts nothing.

Refs are branches or tags only: a raw SHA could be a fork's commit, run with the workflow's secrets.
They start at `live-mobile@4.26.0`: `prepare-build.mts` rejects older ones, which still count the
Debug value with react-native-startup-time.
Pairs are even and at least 6, half before and half after the device swap; fewer give no 95%
interval.

## The build

The E2E "production Firebase" build (`.env.mock.prerelease`): `detoxPreRelease` x86_64 APK on
Android, Release simulator app on iOS, with the JS bundled in the binary. `prepare-build.mts`:

- removes `MOCK`, `DETOX` and the other test-only keys no store env file has, and points swap to
  prod;
- starts the E2E bridge only on a launch that passes `wsPort` (the injection), 20 s after the store
  is ready, so measured launches run no bridge code;
- keeps the real blur, which rspack aliases to the E2E mock for any "mock" env file;
- bundles without `DETOX=1`, which `e2e:build` sets from ef2aed228e8 on (blur mock, and
  `collapsable={false}` on every view);
- adds a `JS start epoch <ms>` startup event, the wall clock of the JS start;
- for `known-regression`'s B, drops the trustchain's `saveAtStart` (LIVE-36190, above).

It checks every anchor before editing, and the edited lines carry `startup-perf`. The scripts and
userdata come from the workflow's ref, so released tags are measured with today's harness. The jobs
write no remote Nx, pnpm, Gradle or AVD cache: they run with develop's role while building any ref.
Gradle downloads its dependencies through JFrog (`jfrog-maven-auth`), like develop's Android builds:
straight from Maven Central, the shared runner IP gets rate-limited (a 429, or 81 min instead of 15
in run 42829119387).

## A launch

- **Inject once per install.** `inject.ts` launches with `wsPort`, sends the settings, accounts and
  post-onboarding state of `e2e/mobile/userdata` through `bridge.ts`, sends the settings again
  10 s later (the store's save effect may not be mounted yet), and fails when the app reports `MOCK`
  or `DETOX`. Feature flags are not imported: they come from production Firebase.
- **Launch** with a plain `am start -W` / `simctl launch`, no test tool attached, wait 5 s, then
  read the `[startup]` lines of the launched process in the device log (logcat's `ReactNativeJS`,
  the simulator's `log show`), which the app writes as soon as the startup is over: a line per
  startup event of the Debug screen (`[startup] App started (x2): 1650 ms`), then the App startup
  time (`[startup] App startup time: 1650 ms, 13 events`). The app writes them at the error level,
  the only one iOS release builds keep, through React Native's `nativeLoggingHook`, which Datadog
  does not see.
- **Check it on the screen.** The warm-ups also let Maestro open the Performance screen, which must
  show the same time: a mismatch fails the run. On iOS a screen read slows the next launch by
  ~280 ms, on either simulator (run 42356679784: the first launch of round 0 by 261–301 ms, the
  second not), so the last warm-up before the rounds reads only the log, and each build is checked
  once per scenario; the report names a build whose check could not read the screen. A launch whose
  lines have not come 20 s after the settle time is read on the screen, and the report counts those
  per build. A build whose warm-up writes no lines does not log its startup (built before #24576):
  both builds are then read on the screen for the rest of the scenario, so pairs stay even, and the
  report says so, even when that warm-up's screen read fails. Until a release with #24576 is in
  production, `prod-vs-release` and `prod-vs-develop` (the nightly) are read on the screen this way.
  `--read both` (the workflow's `read` input) reads every launch both ways, `--read screen` the
  screen only. Screen reads of measured launches use `read-performance-quick.yaml`; warm-ups and
  retries use the full flow, whose optional taps cost ~7 s when no prompt shows. The flows select
  by text: the Debug and Performance screens have no testIDs on any supported ref.
- **Why the log.** Run 42352894550 read 64 launches both ways: the same time on every one. With the
  log only (run 42356679784, 20 pairs), a launch takes 8.5 s on iOS and 10–11 s on Android instead
  of 34–44 s, so the measure jobs take 33 and 22 min instead of ~65 and ~40. Measured iOS launches
  also no longer follow a Maestro read, which made them ~280 ms slower than the warm-ups (runs
  42325407516, 42352894550), and the iOS interval narrowed from about ±30 to ±18 ms.
- **Alternate devices** on every launch: right after a launch on the same simulator, one was
  ~270 ms faster (run 39731729203). Halfway through each scenario A and B swap devices, so the
  difference between the devices cancels out. On Android the other emulator is paused from the
  launch to the read.
- **Recover**: an Android ANR or crash dialog is cleared by restarting its process (recorded as
  `clearedDialogs`), a failed read is retried once with the full flow, and 4 failures in a row on
  one device stop the run. Maestro runs with `--no-reinstall-driver` (~50 s per read otherwise, run
  40006507791) and, on iOS, one driver port per simulator.

## The devices

- **Android**: the E2E AVD (develop's `avd.env`), two emulators with 4 cores each on the 8-CPU
  runner (faster and tighter A/A margins than 2 or 3: runs 39989878998, 39966762708, 39970514979),
  cold-booted (the snapshot has 2 cores), animations on, screen kept on, cellular network (the
  emulated Wi-Fi added ~240–500 ms: runs 39941337433, 39966755704), and idle (load average below 1)
  before the first launch.
- **iOS**: two new simulators of the newest "iPhone N Pro", on the iOS E2E pool, one run at a time,
  measured once the host's 1-minute load is below its CPU count (at most 10 min after boot): 60 s
  after `bootstatus` it was still rising (74 → 128 and 83 → 106, runs 42260331032, 42261755814).

## The analysis

Launches are paired by scenario, phase and round, and a pair is left out when only one of its
launches followed a read of the Debug screen (after a fallback, above). B − A is the Hodges–Lehmann
median of the paired differences, after removing the device bias (half the gap between the two
phases), with a Wilcoxon signed-rank 95% interval. The gate is on the estimate; the mean with a
bootstrap interval is what the manual test compares.

`calibration.test.ts` checks these claims on simulated runs with a known B − A, a 150 ms device bias
and launch outliers. The interval covers the true B − A in 94% of runs (90.5% with 3 and 9 pairs
around the swap), slightly under 95% since the bias is fitted from the same launches. The gate holds
what the report says: a B as fast as A never fails, one slower by the threshold fails about half the
time, and one slower by "Flags a slowdown of" in more than 80% of runs.

Two measures, both ending at "App startup time":

- **Debug screen**: the value as shown. Builds count it from the first JS import (4.26–4.27,
  b3700d9164b) or from the process start (LIVE-40286 on). When A and B count from different starts,
  this row compares from the first JS import.
- **With native start**: from the process start, read by the harness on the app's clock (the
  emulator's clock was ~67 s off the runner's, run 40847012543) and joined through `JS start epoch`.

`analyze.ts` exits 1 on `FAIL` (a Debug screen that disagrees with the device log included),
`Not detected`, `Not enough pairs` or no samples.

## Checks

```bash
pnpm --filter @ledgerhq/mobile-startup-perf test        # also: typecheck, lint, format:check
```

They run in the "E2E Tooling Checks" PR job when this folder changes. `app-contract.test.ts` checks
the mobile app of the checkout against what the measurement needs: `prepare-build.mts` still applies
(LIVE-36190 included), the bridge still handles every message `inject.ts` sends, and the screens the
flows open still show "Debug", "Performance" and "App startup time". The package does not depend on
`live-mobile`, so a mobile PR does not run it: an app change that breaks the measurement fails this
test at the next change to this folder, and a workflow run before that stops in `prepare-build.mts`
on the missing anchor. The code is TypeScript that
Node 24 runs as it is, with no build step: `tsc` checks it in strict mode, so a field renamed in
`Sample` fails wherever it is still used. Only erasable syntax is allowed (no `enum` or
`namespace`), and imports name the `.ts` file.
