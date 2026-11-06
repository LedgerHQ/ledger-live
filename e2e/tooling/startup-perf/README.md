# e2e/tooling/startup-perf

Compares the startup time of two Ledger Wallet Mobile builds, A and B, on two Android emulators or
two iOS simulators. It automates the manual checks B2CQA-6555 (iOS) and B2CQA-6593 (Android).
[test-mobile-startup-perf.yml](../../../.github/workflows/test-mobile-startup-perf.yml) runs it in
CI only. The scripts run on Node alone (the `package.json` only holds the checks' tools): the build
jobs check out this folder alone, the measure jobs add `e2e/mobile/userdata` (and, on Android,
`tools/scripts` and the signing keystore).

| File                      | Role                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `prepare-build.sh`        | Makes the checked-out ref's E2E prerelease build prod-like, before `e2e:build`      |
| `verify-build.sh`         | Checks the built binary: no `MOCK`/`DETOX`, `FORCE_DEBUG_VISIBLE=1`, real blur      |
| `run.mjs`                 | The CLI: installs, injects and launches A and B, writes `samples.jsonl`             |
| `android.mjs`, `ios.mjs`  | The two `Platform`s: install, launch, pause, process start, through adb or simctl   |
| `performance-screen.mjs`  | Reads App startup time and the startup events through Maestro                       |
| `inject.mjs`              | Imports a scenario's userdata through the E2E bridge, once per install              |
| `bridge.mjs`              | The E2E bridge protocol (`apps/ledger-live-mobile/src/e2e/bridge/client.ts`)        |
| `maestro.mjs`, `exec.mjs` | Maestro and child-process calls                                                     |
| `analyze.mjs`             | B − A per scenario, verdict, job summary; exits 1 on a failed or inconclusive check |
| `types.d.mts`             | `Sample` (a line of `samples.jsonl`) and `Platform`, checked by `tsc`               |
| `flows/`                  | Maestro flows that open Settings > Debug > Performance in the running app           |

## Presets

| Preset             | A                              | B                 | Fails when                    |
| ------------------ | ------------------------------ | ----------------- | ----------------------------- |
| `prod-vs-release`  | latest `live-mobile@X.Y.Z` tag | `release` branch  | B is slower by > threshold_ms |
| `custom`           | any branch or tag              | any branch or tag | same                          |
| `aa-noise`         | one build                      | the same binary   | only on `Not enough pairs`    |
| `known-regression` | LIVE-36190 present (`03d6f91`) | fixed (`74af11a`) | the regression is not seen    |

`aa-noise` reports how finely the setup resolves B − A.

Refs are branches or tags only: a raw SHA could be a fork's commit, run with the workflow's secrets.
Pairs are even and at least 6, half before and half after the device swap; fewer give no 95%
interval.

## The build

The E2E "production Firebase" build (`.env.mock.prerelease`): `detoxPreRelease` x86_64 APK on
Android, Release simulator app on iOS, with the JS bundled in the binary. `prepare-build.sh`:

- removes `MOCK`, `DETOX` and the other test-only keys no store env file has, and points swap to
  prod;
- starts the E2E bridge only on a launch that passes `wsPort` (the injection), 20 s after the store
  is ready, so measured launches run no bridge code;
- keeps the real blur, which rspack aliases to the E2E mock for any "mock" env file;
- bundles without `DETOX=1`, which `e2e:build` sets from ef2aed228e8 on (blur mock, and
  `collapsable={false}` on every view);
- adds a `JS start epoch <ms>` startup event, the wall clock of the JS start.

It checks every anchor before editing, and the edited lines carry `startup-perf`. The scripts and
userdata come from the workflow's ref, so older refs can be measured; the build jobs drop two things
older `mise.toml` files have that no longer install (`owner/repo` plugins, the npm pin). The jobs
write no remote Nx, pnpm, Gradle or AVD cache: they run with develop's role while building any ref.

## A launch

- **Inject once per install.** `run.mjs` launches with `wsPort`, sends the settings, accounts and
  post-onboarding state of `e2e/mobile/userdata` through `bridge.mjs`, sends the settings again
  10 s later (the store's save effect may not be mounted yet), and fails when the app reports `MOCK`
  or `DETOX`. Feature flags are not imported: they come from production Firebase.
- **Launch** with a plain `am start -W` / `simctl launch`, no test tool attached, wait 5 s, then let
  Maestro open the Performance screen and read "App startup time" and the startup events. Measured
  reads use `read-performance-quick.yaml`; warm-ups and retries use the full flow, whose optional
  taps cost ~7 s when no prompt shows.
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
- **iOS**: two new simulators of the newest "iPhone N Pro", on the iOS E2E pool, one run at a time.

## The analysis

Launches are paired by scenario, phase and round. B − A is the Hodges–Lehmann median of the paired
differences, after removing the device bias (half the gap between the two phases), with a Wilcoxon
signed-rank 95% interval. The gate is on the estimate; the mean with a bootstrap interval is what
the manual test compares.

Two measures, both ending at "App startup time":

- **Debug screen**: the value as shown. Builds count it from the first JS import (4.26–4.27,
  b3700d9164b), from the process start (LIVE-40286 on; react-native-startup-time on iOS before
  4.26) or from the React host creation (react-native-startup-time on Android before 4.26, 237–649
  ms after the process start: runs 41853176900, 40872918238, 41835997579). When A and B count from
  different starts, this row compares from the first JS import.
- **With native start**: from the process start, read by the harness on the app's clock (the
  emulator's clock was ~67 s off the runner's, run 40847012543) and joined through `JS start epoch`.

`analyze.mjs` exits 1 on `FAIL`, `Not detected`, `Not enough pairs` or no samples.

## Checks

```bash
pnpm --filter @ledgerhq/mobile-startup-perf test        # also: typecheck, lint, format:check
```

They run in the "E2E Tooling Checks" PR job when this folder changes. `app-contract.test.mjs` checks
the mobile app of the checkout against what the measurement needs: `prepare-build.sh` still applies,
the bridge still handles every message `inject.mjs` sends, and the screens the flows open still show
"Debug", "Performance" and "App startup time". The JavaScript is type-checked from JSDoc
(`checkJs`), so a field renamed in `Sample` fails wherever it is still used.
