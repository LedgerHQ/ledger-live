# E2E Tests - Mobile

This folder contains the end-to-end (E2E) tests for the **Ledger Wallet Mobile** app.  
Dev teams are responsible for **adding/updating tests** for new features.

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
export SEED="your 24 word ledger recovery phrase here"
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
export SPECULOS_DEVICE="nanoX"          # Options: nanoSP | nanoX | nanoS | stax | flex | nanoGen5
```

> ⚠️ Replace placeholders with your local paths and credentials.

### 3. Build

Install dependencies and build the app for testing:

```bash
pnpm clean
pnpm i --filter="live-mobile..." --filter="ledger-live" --filter="live-cli..." --filter="ledger-live-mobile-e2e-tests"
pnpm build:llm:deps
pnpm build:cli
# Android debug build
pnpm mobile e2e:build -c android.emu.debug
# iOS debug build
pnpm mobile e2e:build -c ios.sim.debug
```

### 4. Simulators / Emulators

- iOS: Create a simulator named `iOS Simulator` in Xcode
- Android: Create an emulator named `Android_Emulator` in Android Studio

Follow the full wiki if you need setup details.

### 5. Run Tests

- Run all tests:

```bash
# iOS
pnpm e2e:mobile test:ios:debug

# Android
pnpm e2e:mobile test:android:debug
```

- Run a single test file:

```bash
# iOS
pnpm e2e:mobile test:ios:debug <testFileName>

# Android
pnpm e2e:mobile test:android:debug <testFileName>
```

> For CI, sharding, and advanced flags, see [the full wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLM:End-to-end-testing).

### 6. Full Documentation

For complete setup, debugging, workflow, writing tests, and CI integration, see the official wiki:
[Ledger Wallet Mobile E2E Wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLM:End-to-end-testing)

### Notes

- Use Page Object Model (POM) for writing tests
- Keep tests independent and deterministic
- Store SEED securely; never commit it
- Bookmark this README for quick reference
