# E2E Tests - Mobile

This folder contains the end-to-end (E2E) tests for the **Ledger Wallet Mobile** app.
Dev teams are responsible for **adding/updating tests** for new features.

> In an agent tool that supports repo skills, run the `/e2e-mobile-onboard` skill for an interactive setup wizard.
> It checks every prerequisite on your machine, validates environment variables, and guides you through fixes step by step.

---

To write or review a spec, follow [E2E conventions](../docs/e2e-conventions.md) and [Mobile E2E conventions](docs/e2e-mobile-conventions.md). Then follow [Adding or updating a mobile E2E test](docs/e2e-mobile-add-or-update.md).

## Quick Start

### 1. Prerequisites

- macOS (required for iOS development)
- Android Studio (with AVD: Pixel 9 Pro / API 36 recommended)
- Xcode ≥ 16.2 (for iOS)
- Read the e2e environment [guide](https://ledgerhq.atlassian.net/wiki/spaces/QA/pages/6945013939/Ledger+Wallet+E2E+Environment)❗
- Docker Desktop installed and running (Speculos runs in Docker)
- Pull the Speculos image:

```bash
docker pull ghcr.io/ledgerhq/speculos:latest
```

- Install [mise](https://mise.jdx.dev/getting-started.html#installing-mise-cli), then from the repo root install the pinned toolchain:

```bash
mise install
```

### 2. Environment Variables

Set these environment variables before you run tests and change the values as per your testing needs:

```bash
export MOCK="0"
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
export SPECULOS_DEVICE="nanoX"          # Options: nanoSP | nanoX | nanoS | stax | flex | nanoGen5
```

Consider adding these exports to your profile so they persist.

### 3. Build

All build commands below are run from the **repo root** (`ledger-live/`).

```bash
pnpm clean
pnpm i --filter="live-mobile..." --filter="ledger-live" --filter="ledger-live-mobile-e2e-tests..."
pnpm exec nx run ledger-live-mobile-e2e-tests:build-e2e-deps
# Android release build
pnpm mobile e2e:build -c android.emu.release
# iOS debug build
pnpm mobile pod
pnpm mobile e2e:build -c ios.sim.debug
```

> `build-e2e-deps` builds the libraries the mobile app
> and the E2E suite depend on, including @ledgerhq/live-cli.

> **Why release for Android?** Android debug builds are broken locally due to a known
> Detox/Espresso reflection bug (`NoSuchFieldException: eventInjector`). Only release
> builds work. Release bundles JS into the APK, so no Metro bundler is needed for Android.

### 4. Simulators / Emulators

- iOS: Create a simulator named `iOS Simulator` in Xcode
- Android: Create an emulator named `Android_Emulator` in Android Studio

### 5. Run Tests

Test commands below are run from the `e2e/mobile/` directory.

**iOS (debug)** -- requires the Metro bundler running in a separate terminal:

```bash
# Terminal 1: start the bundler (from repo root)
pnpm mobile start

# Terminal 2: run tests (from e2e/mobile/)
pnpm test:ios:debug                      # all tests
pnpm test:ios:debug <testFileName>       # single file
```

**Android (release)** -- no bundler needed, JS is bundled in the APK:

```bash
pnpm test:android                        # all tests
pnpm test:android <testFileName>         # single file
```

> Android debug (`pnpm test:android:debug`) does not work locally due to a known Detox/Espresso bug. Always use the release configuration.

> For CI, sharding, and advanced flags, see [the full wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLM:End-to-end-testing).

## Ledger Wallet Mobile Wiki

For complete setup, debugging, workflow, writing tests, and CI integration, see the official wiki:
[Ledger Wallet Mobile E2E Wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLM:End-to-end-testing)

## Filtering Tests

To run only selected specs when dispatching an E2E workflow, see
[Using `test_filter` in the E2E workflows](../tooling/filter/test-filter-guide.md).

## Remote Speculos (Speculinho)

Tests run on a local Docker Speculos by default. To run them on remote Speculos instances instead, for example to debug a CI run, see the
[Speculinho guide](../../libs/live-e2e-shared/SPECULINHO.md).

To watch the device screen during a local run, on Docker or Speculinho, set `SPECULOS_SCREEN`: see
[Watch the device](../../libs/live-e2e-shared/SPECULINHO.md#watch-the-device).

## Feature Flags

### E2E_FEATURE_FLAGS_JSON

Set `E2E_FEATURE_FLAGS_JSON` to inject flags for the run. To understand the format and how feature flags resolve, refer to [Feature Flags](../docs/e2e-conventions.md#feature-flags).

### Feature Flag presets

It is possible to choose an optional Feature Flag set for the test run.

Set the env var to the desired value, for example:

```bash
export E2E_MOBILE_FEATURE_FLAGS="some-preset"
```

Or use the "Choose a feature flag set" options dropdown on the GitHub workflow.

See the `ffPresetMap` in `utils/featureFlagUtils.ts` for available presets.

## Skipping tests from CI

To keep a spec out of CI, use a `.skip.spec.ts` suffix. See [Known failures and skips](docs/e2e-mobile-conventions.md#a-tracked-failure-must-use-knownfailure).

## Typecheck

Run `pnpm nx typecheck ledger-live-mobile-e2e-tests` to typecheck building workspace libraries first. `pnpm typecheck` in this directory checks the built `lib/` and reports false errors when `libs/live-e2e-shared/src` is newer than that build.

## Before committing a test change

CI runs on a slower, software-rendered emulator, so a wait that is only just long enough passes
locally and fails there. Run the spec you touched under degraded conditions first:

```bash
# from e2e/mobile/ — pass the spec you changed
scripts/flake-check.sh myWallet
```

It throttles the emulator network, starves the guest CPU, then runs the spec 5 times and reports how
many passed. Read the verdict it prints: a failure in some runs but not all means a wait is too tight,
and the fix is the wait rather than a retry. If every test fails, or a run ends before any test
executes, that is a build or setup problem — rebuild and re-run before reading anything into it.
`scripts/flake-check.sh --help` lists the knobs (`--runs`, `--load`, `--network`, `--gpu`).

The default `--load 4` is tuned for native flows. A spec whose assertions land inside a WebView live
app (buy/sell) needs `--load 2` or `3` instead: the guest has 2 vCPUs, so 4 busy loops leave the app
about a third of the CPU and its own 60s web-element waits expire. Measured on
`navigateToBuyFromPortfolioPage_BTC`: 78s at `--load 0`, 66-73s at `--load 2`, and a deterministic
failure at `--load 4`. Below that threshold load is indistinguishable from run-to-run noise, so
raise it until runs slow down, and treat a spec that fails *every* run as a hard limit rather than a
flake.

## Pay tab

Pay tab specs need `BAANX_TEST_CLIENT_KEY`, `BAANX_TEST_USER_EMAIL`, `BAANX_TEST_USER_PASSWORD`, and `BAANX_TEST_USER_TOTP_SECRET` environment variables. See [@ledgerhq/baanx-test-client](../tooling/baanx-test-client/README.md).

A spec that needs an injected Card session must live under `specs/paytab/`. On CI, `globalSetup` mints once before workers when the selected spec paths include that directory. Locally, `globalSetup` does not mint; authentication happens only when a selected Pay tab test reaches `launchApp`. `launchApp` injects the session when the spec path contains `/paytab/`. A Pay tab spec anywhere else launches signed out.

## Stall watchdog

A forked jest worker whose event loop freezes is killed after 90 seconds, so Detox retries the spec
instead of the shard hanging. Look for `[stall-watchdog]` in the log. Local runs are in-band and
unwatched; to debug with `--maxWorkers=2` or more, `export E2E_STALL_WATCHDOG=0`. See
[Stall watchdog](docs/stall-watchdog.md) for how it works.
