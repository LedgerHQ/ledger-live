# Mobile E2E Onboarding Procedure

Full setup wizard for running Ledger Live Mobile E2E tests (Detox) locally.

Work through each phase sequentially. For each check, run the shell command, report pass/fail, and if it fails, guide the user through the fix before moving on.

**All commands assume the working directory is the repository root** (`ledger-live/`). Before Phase 0, verify with `git rev-parse --show-toplevel` and `cd` there if needed.

---

## Phase 0: Platform Selection

Before running any checks, ask the user which platform(s) they want to set up:

- iOS only
- Android only
- Both

Store the selection and use it throughout all subsequent phases to **skip irrelevant checks**. For example:
- iOS only: skip Java, Android SDK, Android emulator, `ANDROID_HOME`, `JAVA_HOME` checks
- Android only: skip Xcode, Ruby, applesimutils, iOS Simulator checks

---

## Phase 1: System Tools

See [/docs/dev/e2e-setup.md](/docs/dev/e2e-setup.md) for the full system checks tables, version policy (PASS / WARN / FAIL rules), and fix commands.

Read the source-of-truth config files first (`.prototools`, `build.gradle`). Then run checks based on the selected platform:
- **Common** (always): Docker, Proto, Node, pnpm
- **iOS only**: Xcode CLI, Xcode version, Ruby >= 3.0, Bundler, applesimutils
- **Android only**: Java, Android SDK (`$ANDROID_HOME`), emulator, sdkmanager (optional)

Apply PASS / WARN / FAIL policy — only FAIL-level results block progression. WARN-only results (sdkmanager missing, Node/pnpm minor/patch drift, Proto absence) must be surfaced but must not block.

**Do not proceed to Phase 2 until all relevant FAIL-level checks are resolved.**

---

## Phase 2: Environment Variables

See [/docs/dev/e2e-setup.md](/docs/dev/e2e-setup.md) for the full variable reference.

Check each variable with: `[ -n "$VAR" ] && echo "set" || echo "NOT SET"`. Skip platform-irrelevant variables based on Phase 0 selection.

Required common variables: `SEED`, `COINAPPS`, `SPECULOS_IMAGE_TAG`, `SPECULOS_DEVICE` (default: `nanoX`), `MOCK` (must be `0`).

Android-only variables: `JAVA_HOME`, `ANDROID_HOME`.

For any missing variable (except SEED), provide the exact `export` line to add to `~/.zshrc`.

**Do not proceed to Phase 3 until all relevant checks pass.**

---

## Phase 3: Simulators / Emulators

The Detox config at `e2e/mobile/detox.config.js` requires **exact device names**. Read the config file to confirm the expected names.

Skip the platform not selected in Phase 0.

### iOS Simulator (skip if Android only)

Run: `xcrun simctl list devices available | grep "iOS Simulator"`

- **Required name**: read from `e2e/mobile/detox.config.js` under `devices.simulator.device.name` (currently `iOS Simulator`)
- If missing, **offer to auto-create it**:
  ```bash
  xcrun simctl create "iOS Simulator" "iPhone 16" "iOS-18-2"
  ```
  Adjust the device type and runtime to match what's available. List available runtimes with `xcrun simctl list runtimes` and device types with `xcrun simctl list devicetypes`.
- If auto-create fails or the user prefers manual setup:
  1. Open Xcode > **Window > Devices and Simulators > Simulators**
  2. Click **+**
  3. Name: `iOS Simulator` (must match config exactly)
  4. Device Type: iPhone 16 (or recent iPhone)
  5. iOS Version: recent stable
  6. Click **Create**

### Android Emulator (skip if iOS only)

Run: `$ANDROID_HOME/emulator/emulator -list-avds | grep Android_Emulator`

- **Required AVD name**: read from `e2e/mobile/detox.config.js` under `devices.emulator.device.avdName` (currently `Android_Emulator`)
- If missing, **offer to auto-create it**:
  ```bash
  avdmanager create avd -n Android_Emulator -k "system-images;android-35;google_apis;arm64-v8a" -d pixel_7_pro
  ```
  Adjust the system image tag to match the installed image.
- Manual setup:
  1. Open Android Studio > **Tools > Device Manager**
  2. Click **Create Virtual Device**
  3. Select a recent Pixel device
  4. System image: API level matching `compileSdkVersion` from `build.gradle`, **`google_apis`** variant (not `google_apis_playstore`)
  5. AVD Name: `Android_Emulator` (must match config exactly)
  6. Click **Finish**

### Architecture and CI check (Android only)

**Detect machine architecture:**

Run: `uname -m`
- `arm64` (Apple Silicon): expected ABI is `arm64-v8a`
- `x86_64` (Intel): expected ABI is `x86_64`

**Cross-check the emulator ABI** (if emulator is running):

Run: `adb shell getprop ro.product.cpu.abi`

**Check for ambient `CI` variable:**

Run: `echo "CI=${CI:-<unset>}"`

`e2e/mobile/detox.config.js` uses `CI` to choose the Android ABI. If `CI` is inherited from a parent process, local Apple Silicon builds will silently produce `x86_64` APKs that fail on an `arm64-v8a` emulator.

- If the machine is `arm64` and `CI` is set: **warn the user**. Prefix Android build and test commands with `CI= ` (unset) to force the correct ABI.
- If the machine is `x86_64` and `CI` is not set: warn that `CI=1` is needed. Suggest `export CI=1`.

Also check:
- `$ANDROID_HOME/build-tools/` exists
- `$ANDROID_HOME/platform-tools/adb` exists

If missing, guide: Android Studio > Tools > SDK Manager > SDK Tools tab > install Build Tools, Platform Tools.

### Emulator free space (Android only)

If the Android emulator is already running, check available storage:

Run: `adb shell df -h /data` and `adb shell du -sh /data/local/tmp`

Thresholds:
- **< 1 GB free**: fail — Detox install will likely fail with "not enough space"
- **1–1.5 GB free**: warn — tight, may cause issues
- **> 1.5 GB free**: pass

If space is low, offer cleanup:
1. `adb shell pm uninstall com.ledger.live.detox` and `adb shell pm uninstall com.ledger.live.detox.test`
2. `adb shell rm -rf /data/local/tmp/*`
3. `adb shell pm trim-caches 4G`
4. If still tight, suggest wiping AVD data in Android Studio > Device Manager > Wipe Data.

If the emulator is not yet running, skip this check and run it before the smoke test in Phase 5 instead.

**Do not proceed to Phase 4 until all relevant checks pass.**

---

## Phase 4: Install Dependencies and Build

Run sequentially (check exit codes between each step):

### 4a. Install dependencies

```bash
pnpm i --filter="live-mobile..." --filter="ledger-live" --filter="live-cli..." --filter="ledger-live-mobile-e2e-tests"
```

### 4b. Build lib dependencies

```bash
pnpm build:llm:deps
```

### 4c. Build CLI

```bash
pnpm build:cli
```

### 4d. Platform-specific build

**iOS** (if selected in Phase 0) — uses **debug** build:
```bash
pnpm mobile pod
pnpm mobile e2e:build -c ios.sim.debug
```

**Android** (if selected in Phase 0) — uses **release** build:

On Apple Silicon (`arm64`), explicitly clear `CI` to ensure the correct ABI:
```bash
CI= pnpm mobile e2e:build -c android.emu.release
```
On Intel (`x86_64`), set `CI=1`:
```bash
CI=1 pnpm mobile e2e:build -c android.emu.release
```

> **Why release for Android?** Android debug builds are broken locally due to a known Detox/Espresso reflection bug (`NoSuchFieldException: eventInjector`). Only release builds work.

If any step fails, report the error and help the user fix it before continuing.

**Common build failures:**
- iOS build fail: `rm -rf apps/ledger-live-mobile/ios/build` then `pnpm mobile pod` then retry
- iOS `pod install` flaky error (`ArgumentError - pathname contains null byte`): known intermittent issue. If first pod succeeded, avoid re-running. Otherwise: `cd apps/ledger-live-mobile/ios && rm -rf Pods Podfile.lock && bundle exec pod install && cd -`
- iOS build appears hung: check if `.app` artifact exists under `apps/ledger-live-mobile/ios/build/Build/Products/` — build likely succeeded.
- Android build fail: `cd apps/ledger-live-mobile/android && ./gradlew clean && cd -` then retry
- OOM: prefix command with `NODE_OPTIONS="--max-old-space-size=10240"`

---

## Phase 5: Smoke Test

Run a single quick test to validate the full setup. Only test the platform(s) selected in Phase 0.

### iOS smoke test (skip if Android only)

iOS uses a **debug** build, which requires the Metro bundler running.

**Terminal 1** — Start the bundler:
```bash
pnpm mobile start
```

**Terminal 2** — Run the smoke test:
```bash
cd e2e/mobile && pnpm test:ios:debug userOpensApplication.spec.ts
```

### Android smoke test (skip if iOS only)

Android uses a **release** build. No Metro bundler needed.

Make sure the emulator is running (`adb devices` should list a device), then run:
```bash
cd e2e/mobile && pnpm test:android userOpensApplication.spec.ts
```

### Both platforms

Start the bundler first (for iOS), run the iOS test, then run the Android test.

Report whether each test passed or failed.

**Common smoke test failures:**
- "Element not found": app may not have loaded — could be a build issue or an unexpected onboarding prompt.
- "Cannot find bundled JS" (iOS only): bundler not running
- Simulator/emulator name mismatch: re-check Phase 3
- `NoSuchFieldException: eventInjector` (Android debug only): project-level Detox/Espresso mismatch. Switch to release: `pnpm test:android`.
- `Requested internal only, but not enough space` (Android): emulator `/data` partition full. See Phase 3 emulator free space.

**Setup vs flow mismatch:**

If the app launches and Detox connects but the test fails on a specific UI element, the problem is likely a **test-flow mismatch**, not a broken setup:
- Confirm the setup is valid (app launched, Detox connected).
- Report that the failure appears to be a test scenario issue.
- Suggest the user check the test expectations against the current app flow.

**Non-blocking warnings to ignore:**
- Watchman recrawl warnings are noisy but non-blocking. Optionally: `watchman watch-del-all && watchman shutdown-server`.

---

## Phase 6: Summary

Print a final checklist. Only include rows for checks that were actually run. Mark skipped platforms as "skipped".

```markdown
## E2E Mobile Setup — Complete

| Check | Status |
|-------|--------|
| Xcode & CLI tools | ✅ / ❌ / skipped |
| Ruby | ✅ / ❌ / skipped |
| applesimutils | ✅ / ❌ / skipped |
| Java | ✅ / ❌ / skipped |
| Android SDK | ✅ / ❌ / skipped |
| Docker | ✅ / ❌ |
| Proto / Node / pnpm | ✅ / ❌ |
| Environment variables | ✅ / ❌ |
| iOS Simulator | ✅ / ❌ / skipped |
| Android Emulator | ✅ / ❌ / skipped |
| Dependencies installed | ✅ / ❌ |
| App built | ✅ / ❌ |
| Smoke test | ✅ / ❌ |
```

If everything passed, confirm the user is ready to run tests with:

```
You're all set! Run tests from e2e/mobile/:

  # iOS (debug — requires bundler running via `pnpm mobile start`)
  pnpm test:ios:debug <testFile.spec.ts>

  # Android (release — no bundler needed)
  pnpm test:android <testFile.spec.ts>

  # All tests
  pnpm test:ios:debug
  pnpm test:android
```

> Note: Android debug builds (`pnpm test:android:debug`) do not work locally due to a known Detox/Espresso bug. Always use the release configuration for Android.

If anything failed, list the remaining issues and offer to help fix them.
