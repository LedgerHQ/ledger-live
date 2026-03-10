# E2E Tests - Mobile

This folder contains the end-to-end (E2E) tests for the **Ledger Wallet Mobile** app.  
Dev teams are responsible for **adding/updating tests** for new features.

> **Cursor users:** Run the `/e2e-mobile-onboard` command for an interactive setup wizard.
> It checks every prerequisite on your machine, validates environment variables, and guides you through fixes step by step.

---

## Quick Start

### 1. Prerequisites

- macOS (required for iOS development)
- Node 22 (via Proto)
- Android Studio (with AVD: Pixel 6 / API 35 recommended)
- Xcode ≥ 16.2 (for iOS)
- Docker Desktop (for Speculos)
- Clone the repositories:

```bash
git clone https://github.com/LedgerHQ/ledger-live.git
git clone https://github.com/LedgerHQ/coin-apps.git
cd ledger-live
proto use
```

### 2. Environment Variables

Set these before running tests:

```bash
export COINAPPS="/path/to/coin-apps"
export MOCK="0"
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
export SPECULOS_DEVICE="nanoX"          # Options: nanoSP | nanoX | nanoS | stax | flex | nanoGen5
```

**SEED** must also be set but should **never** be printed, logged, or committed.
Use [1Password CLI](https://developer.1password.com/docs/cli/) to inject it securely:

```bash
export SEED=$(op read "op://Vault/Item/field")
```

> ⚠️ Replace placeholders with your local paths. Add these exports to `~/.zshrc` so they persist.

### 3. Build

Install dependencies and build the app for testing:

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

All commands below are run from the `e2e/mobile/` directory.

**iOS (debug)** -- requires the Metro bundler running in a separate terminal:

```bash
# Terminal 1: start the bundler
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
- Store SEED securely; never commit it
- Bookmark this README for quick reference
