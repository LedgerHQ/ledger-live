# e2e/tooling/startup-perf

Compares the startup time of two Ledger Wallet Mobile builds, A and B, on two Android emulators or
two iOS simulators. It automates the manual checks B2CQA-6555 (iOS) and B2CQA-6593 (Android).
[test-mobile-startup-perf.yml](../../../.github/workflows/test-mobile-startup-perf.yml) runs it in
CI only. The measurement runs on Node alone, with no install; only the accounts snapshot jobs
install packages (`ws`, and `libs/live-e2e-shared` for its `e2e-cli`). The build jobs check out
`ci/` alone, so the measured ref's Nx never sees a second copy of this package; the measure jobs
check out this folder, `e2e/mobile/userdata` and, on Android, `tools/scripts` and the signing
keystore.

`ci/` holds what the plan, cache, build and Slack jobs run, from a checkout of `ci/` alone and, in
the build jobs, with the measured ref's Node (24.14 or later from `live-mobile@4.26.0` on): it never
imports from `src/` (`src/` may import from `ci/`), and its scripts are `.mts` so Node runs them as
ES modules without the `package.json`. `devices/` holds the shell the snapshot and measure jobs run
to get the emulators or simulators ready, and Maestro for the snapshot, `src/` the three programs
(`snapshot/` makes the accounts snapshot, `measure/` writes `samples.jsonl`, `analysis/` reads it),
and `flows/` the snapshot's Maestro flow. Each test sits next to its module.

| Path                                | Role                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `ci/resolve-refs.mts`               | The plan job: resolves refs A and B to commits, branches and tags only                      |
| `ci/prepare-build.mts`              | Makes the checked-out ref's E2E prerelease build prod-like, before `e2e:build`              |
| `ci/verify-build.mts`               | Checks the built binary: no `MOCK`, `DETOX` or `FORCE_DEBUG_VISIBLE`, real blur             |
| `ci/slack-report.mts`               | The Slack job: the run's result from the jobs and each `summary.json`                       |
| `ci/step.mts`                       | What those share: workspace paths, error annotations, job summary, failing verdicts         |
| `ci/toolchain.sh`                   | Records a build's toolchain beside its `sha.txt`; warns when A's and B's differ             |
| `ci/sides.mts`                      | The restore job's last step: the builds each platform still makes, and its snapshot         |
| `ci/actions/restore/`               | The restore job's composite: looks an entry up, checks it, publishes it as the artifact     |
| `ci/actions/save/`                  | The save job's composite: caches an artifact the run made                                   |
| `ci/actions/build-android/`         | The Android build jobs' composite: the APK, prod-like or not, uploaded                      |
| `ci/actions/build-ios/`             | The iOS build jobs' composite: the simulator app, prod-like or not, uploaded                |
| `devices/boot-emulators.sh`         | Boots the two Android emulators (one for the snapshot): 4 cores, animations on, cellular    |
| `devices/boot-simulators.sh`        | Creates and boots the two simulators (one for the snapshot), then waits for an idle host    |
| `devices/install-maestro.sh`        | Installs the pinned Maestro, checked against its SHA-256                                    |
| `devices/wait-for-idle-host.sh`     | Waits for the iOS host's load to fall below its CPU count after the simulators boot         |
| `src/types.ts`                      | `Sample`: a line of `samples.jsonl`, which `measure/` writes and `analysis/` reads          |
| `src/snapshot/run.ts`               | The CLI that makes the accounts snapshot on one device, through the release's UI            |
| `src/snapshot/bridge.ts`            | The test side of the E2E bridge: sends the app `addKnownSpeculos`, waits for its ACK        |
| `src/snapshot/speculos.ts`          | Starts and stops each coin's Speculinho session through `e2e-cli speculos`                  |
| `src/snapshot/files.ts`             | The snapshot's files: the storage without the device entries, and `snapshot.json`           |
| `src/measure/run.ts`                | The CLI that measures: installs, injects and launches A and B, writes `samples.jsonl`       |
| `src/measure/platforms/`            | `android.ts` and `ios.ts`, the two `Platform`s, through adb or simctl                       |
| `src/measure/startup-log.ts`        | Reads App startup time and the startup events from the app's `[startup]` log lines          |
| `src/measure/inject.ts`             | Writes a scenario's userdata or snapshot into a fresh install, then launches it once        |
| `src/measure/storage.ts`            | The app's storage files (MMKV instance `ledger-live`): writes them, reads them back         |
| `src/measure/maestro.ts`, `exec.ts` | Maestro (the snapshot's flow) and child-process calls                                       |
| `src/analysis/analyze.ts`           | The CLI that judges: pairs A and B, tells which start each Debug value counts from, verdict |
| `src/analysis/stats.ts`             | Median, Hodges–Lehmann with its Wilcoxon interval, bootstrap mean, uneven-phase widening    |
| `src/analysis/report.ts`            | The job summary: B − A per platform and scenario                                            |
| `src/analysis/fake-samples.ts`      | Fake launches for the analysis tests                                                        |
| `flows/`                            | The snapshot's Maestro flow, `add-accounts.yaml`                                            |

## Presets

| Preset             | A                              | B                          | Fails when                        |
| ------------------ | ------------------------------ | -------------------------- | --------------------------------- |
| `prod-vs-release`  | latest `live-mobile@X.Y.Z` tag | `release` branch           | B is slower by > threshold_ms     |
| `prod-vs-develop`  | latest `live-mobile@X.Y.Z` tag | `develop` or `ref_b`       | same                              |
| `anchor`           | `ANCHOR_TAG` or `ref_a`        | `develop` or `ref_b`       | same                              |
| `custom`           | any branch or tag              | any branch or tag          | same                              |
| `aa-noise`         | one build                      | the same binary            | `Not enough pairs`                |
| `known-regression` | this branch or `ref_a`         | A with LIVE-36190 re-added | B is not slower by > threshold_ms |

`aa-noise` reports how finely the setup resolves B − A. `known-regression` shows
whether the gate still catches LIVE-36190 on today's code: B no longer saves the trustchain at
start, so every launch generates its keypair again, the cost #21001 removed (its other half, a zod
check of the keypair, no longer exists).

Every weekday at 03:17 UTC the workflow runs `prod-vs-develop` with the settings of `NIGHTLY` in
`ci/resolve-refs.mts` (both platforms and scenarios, 20 pairs, 100 ms), as a scheduled run has no
inputs; the plan job passes the settings on to the other jobs.

Every weekday at 03:47 UTC, after the nightly, it runs `anchor` with the settings of `ANCHOR`:
develop against `ANCHOR_TAG`, a fixed older release (`live-mobile@4.29.0`, the oldest ref a run
builds). The nightly compares develop with the newest release, so a slowdown spread over several
releases can pass each of them; the anchor run measures the whole drift since that release, against
the same threshold. Move `ANCHOR_TAG` on by pull request, to a release whose startup time is
understood. The plan job tells the two schedules apart by their cron (`ANCHOR_CRON`, in
`SCHEDULE`), and the run's name says `Anchor` instead of `Nightly`, which the QAA KPI dashboard
reads to keep its own series. Its iOS jobs wait behind the nightly's in the performance pool's
queue.

As for the mobile E2E runs, every run posts its result to their Slack results channel, passed or
failed, and a scheduled run or a dispatch with `slack_notif` ticked to #live-repo-health too: each
platform and scenario's Debug screen verdict and B − A, or why it has none (a build that did not
finish, a measurement that timed out). A scheduled run's header says nightly or anchor, from its
cron, even when its plan failed. The header gives the pairs per scenario, and a line its own count
when it has fewer. A measurement that stopped after enough pairs is named on its scenario's line,
from the `measurement.txt` each measure job adds to its results. A verdict whose interval contains
the threshold shows as ⚠️ "Probably within" or "Probably slower by more than" the threshold and
turns the bar yellow, unless another line is ❌; the run still fails on "Probably slower", as the
gate is on the estimate. A post Slack rejects fails the Slack job; a run cancelled by hand posts
nothing.

Refs are branches or tags only: a raw SHA could be a fork's commit, run with the workflow's secrets.
A name that is both a branch and a tag is refused: the release tags are lightweight, so git would
take the branch. Refs start at `live-mobile@4.29.0`, the first release that writes its startup to
the device log (#24576), where it is read: `prepare-build.mts` rejects older ones.
Pairs are even and at least 6, half before and half after the device swap; fewer give no 95%
interval.

A run from develop gets develop's identity (OIDC): its build jobs hold it for JFrog, the develop
cache role trusts it, and the run caches what they build (see "The cache"). So it builds only:

- develop, release, main and hotfix, which only a merged pull request changes, besides the release
  bot's commits (a hotfix check: `prod-vs-release` with `ref_b: hotfix`);
- `live-mobile@X.Y.Z` tags whose commit is on main, or is the release bot's (`live-github-bot`)
  hotfix release commit, committed and signed by GitHub, which a released hotfix's tag is on and
  which stays off main's history. No rule protects the tags, so the plan checks this through the
  GitHub API, for A, B and the accounts snapshot's release, whose E2E app
  `build-snapshot-<platform>` builds. The bot also commits on Renovate branches, hence the commit
  message. A call that fails with a network error, a rate limit (429, or 403 with no request left)
  or a 5xx is tried again twice.

To measure another branch, run the workflow from that branch: a run from any other branch gets the
branch cache role, builds any ref and saves nothing. Its snapshot's release is still checked: the
snapshot job runs that release's E2E app with the E2E seed in its environment, in every run, so
the release must be a tag whose commit passes the check above.

## The build

The E2E "production Firebase" build (`.env.mock.prerelease`): `detoxPreRelease` x86_64 APK on
Android, Release simulator app on iOS, with the JS bundled in the binary. `prepare-build.mts`:

- removes `MOCK`, `DETOX` and the other test-only keys no store env file has, and points swap to
  prod: without `DETOX` the E2E bridge never starts;
- keeps the real blur, which rspack aliases to the E2E mock for any "mock" env file;
- bundles without `DETOX=1`, which `e2e:build` sets from ef2aed228e8 on (blur mock, and
  `collapsable={false}` on every view);
- for `known-regression`'s B, drops the trustchain's `saveAtStart` (LIVE-36190, above).

It checks every anchor before editing, including the app's own `Before js imports` startup event,
from which the analysis tells the start each launch counts from, and the edited lines carry
`startup-perf`. The scripts and userdata come from the workflow's ref, so released tags are measured
with today's harness. The jobs write no remote Nx, pnpm, Gradle or AVD cache: they run with
develop's role while building any ref. Gradle downloads its dependencies through JFrog
(`jfrog-maven-auth`), like develop's Android builds: straight from Maven Central, the shared runner
IP can get a 429 (run 42829119387).

### The cache

The mobile E2E builds' S3 cache (`ll-nx-cache`) keeps what a run would otherwise make again, and
what only changes on a release: build A of a `live-mobile@X.Y.Z` tag, and that release's accounts
snapshot (see "The accounts snapshot" for its key). Two jobs read and write it, through
this folder's composites, referenced by path so a branch runs its own: `restore-cache` looks each
entry up (`ci/actions/restore`) and publishes a whole one as the artifact its job would have
uploaded, then `ci/sides.mts` leaves it out of what the run makes; `save-cache` caches what
the run made (`ci/actions/save`). The plan says whether to look the cache up (`restore`) and whether
this run may write it (`save`).

- **Build A's key:** `develop/startup-perf-<platform>-<commit A>-<hash>-<ISO week>-<version>`. The
  hash covers the workflow, its build composites (`ci/actions/build-*`), `prepare-build.mts`,
  `verify-build.mts`, `step.mts` and `toolchain.sh`. Bump the version by hand when something else
  the build depends on changes.
- **Toolchain:** B is built on the day's runners, whose Xcode, JDK or `@develop` composites can
  change without changing the key. The week in the key rebuilds A at least weekly, and each build
  writes `toolchain.txt` beside `sha.txt` (`ci/toolchain.sh`): the measure jobs warn when A's and
  B's differ, as a startup difference may then come from the toolchain. Node is left out: each ref
  pins its own in `mise.toml`, so a different Node is part of the code compared.
- **Restore (`restore-cache`):** every run reads `develop/`, which only develop's role writes, so
  no run restores what a branch run made. An entry counts once its download succeeded and its
  check holds (build A: its commit and binary match; the snapshot: its release matches and its
  storage file is not empty): the job publishes it as the run's artifact, and the job that would
  make it skips it.
- **Save (`save-cache`):** only in a run from develop, and only when B is develop, release or main
  (the branches only a pull request changes), or in a single-commit preset (`aa-noise`,
  `known-regression`), whose B is built from A's commit, when that commit is reviewed: the run's
  own branch, a release tag's, or develop, release or main. A `custom` run with the same tag on
  both sides is not saved. B's build job runs B's code, which could replace another job's artifact
  before it is cached. Build A is saved only when it is a release tag's; the snapshot always is a
  release's.
- **Isolation:** neither cache job runs the measured code, and the build jobs are given no cache
  credentials. They keep `id-token: write` for JFrog's OIDC login, though, so the code they build
  could request an OIDC token for the run's ref. Whether that token can assume the develop cache
  role depends on that role's trust policy.
- **Best-effort:** both jobs continue on error and time out. A cache that cannot be read or written
  only means making build A and the snapshot as before.

## The accounts snapshot

The accounts scenario starts from accounts added through the app's UI, as a user adds them:

- **Made**: by `src/snapshot/run.ts` on the E2E build of A's `live-mobile@X.Y.Z` release, or of the
  latest one when A is not a release tag, as built for E2E (not made prod-like), one snapshot per
  platform. So A never reads the storage of a newer app than itself (the anchor's A is older than
  the latest release), and B starts from the storage of the release it is compared with, as a user
  who updates from it. It writes the no-accounts userdata
  (`skip-onboarding`) with the release's tours marked as seen (their sheet would cover the deep
  link, and a user who adds accounts has seen them), then launches the app with `wsPort`, `wsToken`
  and `mock=0` (the build has `MOCK`, whose bridges would add mock accounts). For Bitcoin, Ethereum
  and Solana in turn, it starts a Speculinho session with `pnpm e2e-cli speculos` of
  `libs/live-e2e-shared` (the E2E suites' firmware, app versions and session tokens, on a `nanoX`
  with the E2E seed), sends the app `addKnownSpeculos` through `bridge.ts` and waits for its ACK,
  then `flows/add-accounts.yaml` (through Maestro, with `--no-reinstall-driver`, which saves ~50 s
  per call: run 40006507791) adds the accounts the scan selects, those with operations, as
  e2e/mobile's add-account steps and a user who keeps the selection do, picking the coin's network
  when the drawer asks for one. The storage it keeps leaves out what belongs to that install: the
  device entries (`ble`, `knownDevices`, `settings.lastConnectedDevice`), since a prod build has no
  Speculos to reach, the client ids (`identities`, formerly `user`), which each install makes as the
  no-accounts ones do, and the `trustchain`, whose member keypair each install makes
  (`known-regression`'s B makes it at every launch, which a stored one would hide). It fails unless
  each coin has an account.
- **Cached**: in the build cache (above) under
  `develop/startup-perf-snapshot-<platform>-<release>-<hash>-<version>`, where the hash covers every
  module `src/snapshot/run.ts` imports (`src/snapshot/`, the `measure/` modules it writes and reads
  storage with, `ci/step.mts` and the types), not their tests, the flow, the `skip-onboarding`
  userdata and the `e2e-cli speculos` command's own files: a new release or a change to them makes a
  new snapshot. Not the E2E suites' Speculos settings the command reuses
  (`libs/live-e2e-shared/src/speculos*.ts`): they change every few days and do not change the
  accounts the scan finds. Bump the version by hand when one of them must make a new snapshot. When
  `restore-cache` does not restore it, `build-snapshot-<platform>` builds the release's E2E build in
  its own job, so a failed one cancels neither A nor B, and `snapshot-<platform>` makes the snapshot
  on one emulator (the 8-CPU runner) or simulator (the performance pool, in the iOS measurement
  queue); `save-cache` then caches it, under the cache's rules. A snapshot that fails skips that
  platform's measurement; failing to read or write the cache fails nothing, as the snapshot is then
  made, or used without being saved.
- **Measured**: `run.ts --accounts-snapshot <dir>` writes it into each install in place of the
  accounts userdata (`--accounts-userdata` stays for local runs).

## A launch

- **Inject once per install.** Before the first launch, `inject.ts` writes the scenario's storage
  into the app's: the settings (terms accepted) and post-onboarding state of `e2e/mobile/userdata`,
  or the accounts snapshot (above), as the two files of its MMKV instance `ledger-live`
  (`storage.ts`): as root (`su`) into `files/mmkv` with the app's user and SELinux label on Android,
  into the data container's `Documents/mmkv` on iOS. These are the keys the app saves after an E2E
  bridge import, and at boot it reads them through the same `importStore`. It then launches the app
  once for 30 s, not measured, so it syncs the accounts and saves what it builds itself
  (countervalues, token cache), as the bridge's injection launch did, and longer while the storage
  does not show the checks below yet, up to 3 min (a slow first sync). It then reads the storage
  back: it fails unless the app saved its client ids into it (it saves them at every start, and none
  is written, so the app read this storage), and unless the accepted terms and a record for every
  account written are still there (MMKV drops a file whose CRC does not match, the app an account it
  does not support), so A and B start from the same accounts, and unless the app saved one of them
  again: it saves accounts only once one changes (a sync), and only that save deletes the record of
  an account it did not load. So that one always changes, each currency's first account is written
  with its balance one unit higher, which its sync puts back (the app ignores `lastSyncDate`, so a
  sync with nothing new on chain would save none). Feature flags are not written: they come from
  production Firebase. `prepare-build.mts` checks that each measured ref starts the E2E bridge only
  with `DETOX`, and `verify-build.mts` that the binary has no `MOCK` or `DETOX`. `prepare-build.mts`
  also removes `FORCE_DEBUG_VISIBLE`, which only shows Settings > Debug: nothing opens it.
- **Warm up 6 times on Android** before the rounds. In the first launches after an install (2–6,
  ~20–230 s), Braze's content-card refresh put ~110 ms of JS before App started in about half of
  them, never later: with 6 warm-ups the slow early rounds fell from 35–49% to 10–15% (runs
  43996795129, 43996836527). iOS keeps 1, as it was not measured. A warm-up costs one launch, ~11 s.
  Both builds are installed first, then warmed up in turn like the rounds, on iOS too (not measured
  there). When each build warmed up right after its install, the first one idled ~2 min through the
  other's install and warm-ups, and its round 0 was ~60 ms slower than its later rounds, the
  second's no slower beyond noise (median of 30 Android A/A runs, e.g. 44243454200). Warmed up in
  turn, it is ~15 ms faster than its later rounds, against ~60 ms slower for the old order in the
  same wave (10 runs against 6, e.g. 44281313344 against 44281225038), with about the same A/A
  spread.
- **Launch** with a plain `am start -W` / `simctl launch`, no test tool attached, wait 5 s, then
  read the `[startup]` lines of the launched process in the device log (logcat's `ReactNativeJS`,
  the simulator's `log show`), which the app writes as soon as the startup is over: a line per
  startup event of the Debug screen (`[startup] App started (x2): 1650 ms`), then the App startup
  time (`[startup] App startup time: 1650 ms, 13 events`). The app writes them at the error level,
  the only one iOS release builds keep, through React Native's `nativeLoggingHook`, which Datadog
  does not see. A measured launch lives ~6 s (iOS) or ~7–8 s (Android) from its process start: the
  next launch stops it. A launch whose lines have not come 20 s after the settle time, came
  unreadable (their event lines do not add up to the count the last line gives) or give a time of 0
  or less fails, as any failed launch (see Recover).
- **Why the log only.** Run 42352894550 read 64 launches both from the log and on the Debug screen
  through Maestro: the same time on every one. From the log (run 42356679784, 20 pairs), a launch
  takes 8.5 s on iOS and 10–11 s on Android instead of 34–44 s, so the measure jobs take 33 and 22
  min instead of ~65 and ~40. On iOS a screen read also made the next launch ~280 ms slower, on
  either simulator (runs 42325407516, 42352894550, 42356679784), and without it the iOS interval
  narrowed from about ±30 to ±18 ms. The measurement no longer opens the Debug screen at all, and
  the measure jobs no longer install Maestro.
- **Alternate devices** on every measured launch: right after a launch on the same simulator, one
  was ~270 ms faster (run 39731729203). Halfway through each scenario A and B swap devices, so the
  difference between the devices cancels out. On Android the other emulator is paused from the
  launch to the read.
- **Recover**: an Android ANR or crash dialog is cleared by restarting its process (recorded as
  `clearedDialogs`), a failed launch counts in the report's failed launches and leaves its pair out,
  and 4 failures in a row on one device stop the run.

## The devices

- **Android**: the E2E AVD (develop's `avd.env`), two emulators with 4 cores each on the 8-CPU
  runner (faster and tighter A/A margins than 2 or 3: runs 39989878998, 39966762708, 39970514979),
  cold-booted (the snapshot has 2 cores), animations on, screen kept on, cellular network (the
  emulated Wi-Fi added ~240–500 ms: runs 39941337433, 39966755704), the Messages and Google apps
  disabled (their background jobs, a few minutes after boot, took the CPUs in ~4% of launches,
  +20–100 ms), and idle (load average below 1) before the first launch.
- **iOS**: two new simulators of the newest "iPhone N Pro", on the iOS E2E pool, one run at a time,
  measured once the host's 1-minute load is below its CPU count (at most 10 min after boot): 60 s
  after `bootstatus` it was still rising (74 → 128 and 83 → 106, runs 42260331032, 42261755814).

## The analysis

Launches are paired by scenario, phase and round. B − A is the Hodges–Lehmann median of the
paired differences, after removing the device bias (half the gap between the two phases), with a
Wilcoxon signed-rank 95% interval. The gate is on the estimate; the mean with a bootstrap interval
is what the manual test compares.

`calibration.test.ts` checks these claims on simulated runs with a known B − A, a 150 ms device bias
and launch outliers. The interval covers the true B − A in 94% of runs (90.5% with 3 and 9 pairs
around the swap), slightly under 95% since the bias is fitted from the same launches. The gate holds
what the report says: a B as fast as A never fails, one slower by the threshold fails about half the
time, and one slower by "Flags a slowdown of" in more than 80% of runs.

One measure, **Debug screen**: Settings > Debug > Performance > App startup time, as the app writes
it to the device log, counted from the app process start (LIVE-40286, from 4.28 on; 4.26–4.27
counted from the first JS import, b3700d9164b). A launch whose `Before js imports` event comes
within 50 ms of its start was counted from the first JS import, as when the app finds no process
start, and misses the native startup: it is left out whatever the build's other launches did, with
its pair, and the report names how many. When fewer than 3 pairs are left on either side of the
device swap (at 20 pairs, when 8 of a phase's 10 are lost), the row fails as `Not enough pairs`;
otherwise it is judged on the pairs left, with a wider interval. Until #25529, the harness also
measured from the process start it read itself ("With native start"), and compared from the first JS
import when A and B counted from different starts: on 4.29 and later builds the native start matched
the Debug value within 6 ms on every nightly row, with the same verdicts.

`analyze.ts` exits 1 on `FAIL`, `Not detected`, `Not enough pairs` or no samples.

Each results artifact holds the rows as `summary.json` and the run they come from as `run.json`
(preset, threshold, planned pairs, labels A and B), so a reader of the artifact alone, such as the
QAA KPI dashboard, knows what was compared.

## Checks

```bash
pnpm --filter @ledgerhq/mobile-startup-perf test        # also: typecheck, lint, format:check
```

They run in the "E2E Tooling Checks" PR job when this folder changes. `app-contract.test.ts` checks
the mobile app of the checkout against what the measurement needs: `prepare-build.mts` still applies
(LIVE-36190 included), the E2E bridge still starts only with `DETOX`, the app still reads the
storage `storage.ts` writes (instance, keys, migration status, terms version) and saves its client
ids at every start, and it still writes its startup to the device log as `startup-log.ts` reads it.
The package does not depend on `live-mobile`, so a mobile PR does not run it: an app change that
breaks the measurement fails this test at the next change to this folder, and a workflow run before
that stops in `prepare-build.mts` on the missing anchor. The code is TypeScript that Node 24 runs as
it is, with no build step: `tsc` checks it in strict mode, so a field renamed in `Sample` fails
wherever it is still used. Only erasable syntax is allowed (no `enum` or `namespace`), and imports
name the `.ts` file.
