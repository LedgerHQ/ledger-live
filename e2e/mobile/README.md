# E2E Tests - Mobile

This folder contains the end-to-end (E2E) tests for the **Ledger Wallet Mobile** app.  
Dev teams are responsible for **adding/updating tests** for new features.

> **Cursor users:** Run the `/e2e-mobile-onboard` command for an interactive setup wizard.
> It checks every prerequisite on your machine, validates environment variables, and guides you through fixes step by step.

---

## Quick Start

### 1. Prerequisites

- macOS (required for iOS development)
- Android Studio (with AVD: Pixel 6 / API 35 recommended)
- Xcode ≥ 16.2 (for iOS)
- Read the e2e environment [guide](https://ledgerhq.atlassian.net/wiki/spaces/QA/pages/6945013939/Ledger+Wallet+E2E+Environment)❗
- Docker Desktop installed and running (Speculos runs in Docker)
- Pull the Speculos image:

```bash
docker pull ghcr.io/ledgerhq/speculos:latest
```

- Enable Proto for version management:

```bash
proto use
```

- Install [mise](https://mise.jdx.dev/getting-started.html#installing-mise-cli) then run:

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
pnpm i --filter="live-mobile..." --filter="ledger-live" --filter="live-cli..." --filter="ledger-live-mobile-e2e-tests"
pnpm build:llm:deps
pnpm build:cli
# Android release build
pnpm mobile e2e:build -c android.emu.release
# iOS debug build
pnpm mobile pod
pnpm mobile e2e:build -c ios.sim.debug
```

> **Why release for Android?** Android debug builds are broken locally due to a known
> Detox/Espresso reflection bug (`NoSuchFieldException: eventInjector`). Only release
> builds work. Release bundles JS into the APK, so no Metro bundler is needed for Android.

### 4. Simulators / Emulators

- iOS: Create a simulator named `iOS Simulator` in Xcode
- Android: Create an emulator named `Android_Emulator` in Android Studio

Follow the full wiki if you need setup details.

### 5. Run Tests

Test commands below are run from the `e2e/mobile/` directory.

**iOS (debug)** -- requires the Re.Pack bundler running in a separate terminal:

```bash
# Terminal 1: start the bundler with E2E mode (from e2e/mobile/ or repo root)
pnpm e2e:mobile start          # from repo root
# OR: pnpm start               # from e2e/mobile/

# Terminal 2: run tests (from e2e/mobile/)
pnpm test:ios:debug                      # all tests
pnpm test:ios:debug <testFileName>       # single file
```

> **Why `start:e2e` instead of `start`?** The E2E bundler must run with `DETOX=1` so that
> `@sbaiahmed1/react-native-blur` is replaced by a plain-View mock. Without it, `ProgressiveBlurView`
> triggers a `NSInvalidArgumentException` crash in DetoxSync on iOS.

**Android (release)** -- no bundler needed, JS is bundled in the APK:

```bash
pnpm test:android                        # all tests
pnpm test:android <testFileName>         # single file
```

> Android debug (`pnpm test:android:debug`) does not work locally due to a known Detox/Espresso bug. Always use the release configuration.

> For CI, sharding, and advanced flags, see [the full wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLM:End-to-end-testing).

### 6. Full Documentation

For complete setup, debugging, workflow, writing tests, and CI integration, see the official wiki:
[Ledger Wallet Mobile E2E Wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLM:End-to-end-testing)

### Skipping Tests from CI

To temporarily exclude a test file from CI runs, rename it with a `.skip.spec.ts` suffix instead of `.spec.ts`. For example:

```bash
# This test will run:
myFeature.spec.ts

# This test will be skipped:
myFeature.skip.spec.ts
```

### Notes

- Use Page Object Model (POM) for writing tests
- Keep tests independent and deterministic
- Bookmark this README for quick reference
