---
description: Interactive setup wizard for running mobile E2E (Detox) tests locally
---

# Mobile E2E Onboarding

You are an interactive setup wizard that checks the developer's machine and guides them through every prerequisite for running Ledger Live Mobile E2E tests (Detox) locally.

Work through each phase sequentially. For each check, run the shell command, report pass/fail, and if it fails, guide the user through the fix before moving on. Use TodoWrite to track progress across phases.

**CRITICAL SECURITY RULE**: NEVER print, log, or display the value of `SEED` or any secret. Only confirm whether it is set or not.

---

## Phase 0: Platform Selection

Before running any checks, ask the user which platform(s) they want to set up using the AskQuestion tool:
- iOS only
- Android only
- Both

Store the selection and use it throughout all subsequent phases to **skip irrelevant checks**. For example:
- iOS only: skip Java, Android SDK, Android emulator, `ANDROID_HOME`, `JAVA_HOME` checks
- Android only: skip Xcode, Ruby, applesimutils, iOS Simulator checks

---

## Phase 1: System Tools

**Do NOT hardcode expected versions.** Read the source-of-truth config files to determine what's required:

| Tool | Source of truth | How to read |
|------|----------------|-------------|
| Node | `.prototools` | `grep "^node" .prototools` |
| pnpm | `.prototools` | `grep "^pnpm" .prototools` |
| Java | `apps/ledger-live-mobile/android/build.gradle` | Look for `JavaVersion.VERSION_XX` in `sourceCompatibility` |
| Android SDK API | `apps/ledger-live-mobile/android/build.gradle` | Look for `compileSdkVersion` |
| Ruby | No pinned version in repo | Just check `ruby --version` returns >= 3.0 (needed for CocoaPods) |
| Xcode | No pinned version in repo | Just check `xcodebuild -version` returns a recent version |

First, read the config files to determine expected versions. Then run these checks (skip those not relevant to the selected platform):

**Common checks (always run):**

| Check | Command | Expected |
|-------|---------|----------|
| Docker | `docker --version` | Installed |
| Proto | `proto --version` | Installed (recommended, not required) |
| Node | `node --version` | See version policy below |
| pnpm | `pnpm --version` | See version policy below |

**Node / pnpm version policy:**

`.prototools` is the source of truth for the **recommended** versions. The check should:
- **PASS** if the active version matches the pinned version exactly.
- **WARN** if the active major version matches but the minor/patch differs (e.g. pinned `22.13.1`, active `22.14.0`). This is acceptable and should not block the setup.
- **FAIL** only if the active major version is different or older than the pinned major version (e.g. pinned Node 22, active Node 20).

Do not fail just because the binary path is not under `~/.proto/`. The version is what matters, not the install method. If Proto is installed, suggest running `proto use` from the repo root to align versions.

**iOS checks (skip if Android only):**

| Check | Command | Expected |
|-------|---------|----------|
| Xcode CLI tools | `xcode-select -v` | Installed |
| Xcode version | `xcodebuild -version` | Recent stable version |
| Ruby | `ruby --version` | >= 3.0 (any installation method is fine -- Homebrew, rbenv, asdf, system, etc.) |
| Bundler | `bundle --version` | Installed (needed for CocoaPods in this repo) |
| applesimutils | `which applesimutils` | Installed |

**Ruby validation note:** Check the version number returned by `ruby --version`, not the path. Do not fail because `which ruby` points to a non-Homebrew location. The real requirement is: Ruby >= 3.0 and `bundle` is available. Optionally also check `bundle exec pod --version` from `apps/ledger-live-mobile` to confirm CocoaPods works.

**Android checks (skip if iOS only):**

| Check | Command | Expected |
|-------|---------|----------|
| Java | `java -version` | Major version matching `build.gradle` `JavaVersion` |
| Android SDK | `echo $ANDROID_HOME` | Non-empty, directory exists |
| Android emulator | `$ANDROID_HOME/emulator/emulator -list-avds` | At least one AVD |
| sdkmanager (optional) | `command -v sdkmanager` or check known paths | Available (nice-to-have, not required for running tests) |

**sdkmanager path note:** `sdkmanager` may be installed at `$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager`, under a Homebrew path like `/opt/homebrew/share/android-commandlinetools/cmdline-tools/latest/bin/sdkmanager`, or elsewhere on `$PATH`. Accept any of these. If it is not found at all, this is a **warning**, not a failure -- `sdkmanager` is only needed to install new SDK components, not to run tests.

**Fix commands for common failures:**

- Xcode CLI: `xcode-select --install`
- Ruby: install via your preferred method (Homebrew, rbenv, asdf, etc.) -- just ensure version >= 3.0
- applesimutils: `brew tap wix/brew && brew install applesimutils`
- Java: `brew install openjdk@<version>` (use the version from `build.gradle`)
- Docker: Install Docker Desktop from https://www.docker.com/products/docker-desktop/
- Proto: `curl -fsSL https://moonrepo.dev/install/proto.sh | bash` then `proto use` from repo root
- Android SDK / `ANDROID_HOME`: Add to `~/.zshrc`:
  ```
  export JAVA_HOME=$(/usr/libexec/java_home)
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools/bin/sdkmanager:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
  ```

**Do not proceed to Phase 2 until all relevant checks pass.**

---

## Phase 2: Environment Variables

Check each variable is set and valid. Run `[ -n "$VAR" ] && echo "set" || echo "NOT SET"` for each.

Skip platform-irrelevant variables based on Phase 0 selection.

**Common variables (always check):**

| Variable | Validation | Default / Guidance |
|----------|------------|-------------------|
| `COINAPPS` | Non-empty AND directory exists (`[ -d "$COINAPPS" ]`) | Path to cloned `coin-apps` repo. If not cloned: `git clone https://github.com/LedgerHQ/coin-apps.git` |
| `SEED` | Non-empty only (`[ -n "$SEED" ]`). **NEVER print its value.** | See SEED guidance below. |
| `SPECULOS_IMAGE_TAG` | Non-empty | `ghcr.io/ledgerhq/speculos:latest` |
| `SPECULOS_DEVICE` | Non-empty | `nanoX` (options: nanoS, nanoSP, nanoX, stax, flex, nanoGen5) |
| `MOCK` | Equals `0` | `0` |

**Android variables (skip if iOS only):**

| Variable | Validation | Default / Guidance |
|----------|------------|-------------------|
| `JAVA_HOME` | Non-empty AND directory exists | `$(/usr/libexec/java_home)` |
| `ANDROID_HOME` | Non-empty AND directory exists | `$HOME/Library/Android/sdk` |

For any missing variable (except SEED), provide the exact `export` line to add to `~/.zshrc`.

**SEED guidance:**

The SEED must be set but its value must **NEVER** be printed, logged, or displayed by this command.

Recommended approach (persistent):
```
export SEED=$(op read "op://Vault/Item/field")
```
Add to `~/.zshrc` for persistence. This uses 1Password CLI to inject the value securely.

Also acceptable (session-only):
```
export SEED="<value>"
```
A manual one-time export in the current terminal session is fine for local E2E, especially when using a known public test seed. Do not add raw seed values to shell config files.

Both approaches are valid. The key rules are:
- This command must never echo, print, or log the SEED value in command output.
- Never commit SEED values to version control.

**Do not proceed to Phase 3 until all relevant checks pass.**

---

## Phase 3: Simulators / Emulators

The Detox config at `e2e/mobile/detox.config.js` requires **exact device names**. This is a config convention in this repo, not a Detox limitation. Read the config file to confirm the expected names.

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
- If missing, **offer to auto-create it** (requires `avdmanager` on PATH or under `$ANDROID_HOME/cmdline-tools/`):
  ```bash
  avdmanager create avd -n Android_Emulator -k "system-images;android-35;google_apis;arm64-v8a" -d pixel_7_pro
  ```
  Adjust the system image tag to match the installed image. If `avdmanager` is not available, guide the manual route.
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
- Confirm the emulator ABI matches the machine architecture.

**Check for ambient `CI` variable:**

Run: `echo "CI=${CI:-<unset>}"`

This is critical: `e2e/mobile/detox.config.js` uses `CI` to choose the Android ABI (`x86_64` when CI is set, `arm64-v8a` otherwise). If `CI` is inherited from a parent process, IDE, or wrapper shell, local Apple Silicon builds will silently produce `x86_64` APKs that fail on an `arm64-v8a` emulator.

- If the machine is `arm64` and `CI` is set: **warn the user explicitly**. Explain that the Android build and test commands in Phase 4 and 5 will be prefixed with `CI= ` (unset) to force the correct ABI. If `CI=1` is in their `~/.zshrc`, recommend removing it or scoping it only to CI scripts.
- If the machine is `x86_64` and `CI` is not set: warn that `CI=1` is needed for correct ABI. Suggest `export CI=1`.

Also check these Android SDK components are installed:
- `$ANDROID_HOME/build-tools/` exists
- `$ANDROID_HOME/platform-tools/adb` exists

If missing, guide: Android Studio > Tools > SDK Manager > SDK Tools tab > install Build Tools, Platform Tools.

### Emulator free space (Android only)

If the Android emulator is already running, check available storage:

Run: `adb shell df -h /data` and `adb shell du -sh /data/local/tmp`

Thresholds:
- **< 1 GB free**: fail -- Detox install will likely fail with "not enough space"
- **1 - 1.5 GB free**: warn -- tight, may cause issues during test runs
- **> 1.5 GB free**: pass

If space is low, offer these cleanup actions:
1. `adb shell pm uninstall com.ledger.live.detox` and `adb shell pm uninstall com.ledger.live.detox.test`
2. `adb shell rm -rf /data/local/tmp/*`
3. `adb shell pm trim-caches 4G`
4. If still tight, suggest wiping AVD data: Android Studio > Device Manager > Wipe Data, or recreate the emulator with a larger data partition.

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

**iOS** (if selected in Phase 0) -- uses **debug** build:
```bash
pnpm mobile pod
pnpm mobile e2e:build -c ios.sim.debug
```

**Android** (if selected in Phase 0) -- uses **release** build:

On Apple Silicon (`arm64`), explicitly clear `CI` to ensure the correct ABI:
```bash
CI= pnpm mobile e2e:build -c android.emu.release
```
On Intel (`x86_64`), set `CI=1`:
```bash
CI=1 pnpm mobile e2e:build -c android.emu.release
```

> **Why release for Android?** Android debug builds are broken locally due to a known Detox/Espresso reflection bug (`NoSuchFieldException: eventInjector`). This is a project-level debug dependency issue, not a machine setup problem. Only release builds work. Release bundles JS into the APK, so no Metro bundler is needed for Android.

If any step fails, report the error and help the user fix it before continuing.

**Common build failures:**
- iOS build fail: `rm -rf apps/ledger-live-mobile/ios/build` then `pnpm mobile pod` then retry
- iOS `pod install` flaky error (`ArgumentError - pathname contains null byte`): this is a known intermittent issue with CocoaPods in pnpm monorepos. If the first `pnpm mobile pod` succeeded, avoid forcing another pod regeneration. If it keeps failing, try `cd apps/ledger-live-mobile/ios && rm -rf Pods Podfile.lock && bundle exec pod install && cd -`.
- iOS build appears hung: if the `.app` artifact already exists under `apps/ledger-live-mobile/ios/build/Build/Products/`, the build likely succeeded even if the terminal did not show a clean exit. Check for the artifact before retrying.
- iOS build fails on native compilation errors (e.g. Xcode / React Native compatibility): this is a **project-level issue**, not a machine setup problem. Report it as such.
- Android build fail: `cd apps/ledger-live-mobile/android && ./gradlew clean && cd -` then retry
- OOM: prefix command with `NODE_OPTIONS="--max-old-space-size=10240"`

---

## Phase 5: Smoke Test

Run a single quick test to validate the full setup. Only test the platform(s) selected in Phase 0.

### iOS smoke test (skip if Android only)

iOS uses a **debug** build, which requires the Metro bundler running.

**Terminal 1** -- Start the bundler:
```bash
pnpm mobile start
```

**Terminal 2** -- Run the smoke test:
```bash
cd e2e/mobile && pnpm test:ios:debug userOpensApplication.spec.ts
```

### Android smoke test (skip if iOS only)

Android uses a **release** build. JS is bundled in the APK -- no Metro bundler or port bridging needed.

Make sure the emulator is running (`adb devices` should list a device), then run:
```bash
cd e2e/mobile && pnpm test:android userOpensApplication.spec.ts
```

### Both platforms

If both were selected, start the bundler first (for iOS), run the iOS test, then run the Android test. The Android test does not depend on the bundler.

Report whether each test passed or failed. If it failed, check the error output and help debug.

**Common smoke test failures:**
- "Element not found": the app may not have loaded yet -- could be a build issue, or an optional onboarding prompt (e.g. analytics opt-in) that the test does not expect. See "Setup vs flow mismatch" below.
- "Cannot find bundled JS" (iOS only): bundler not running
- Simulator/emulator name mismatch: re-check Phase 3
- `NoSuchFieldException: eventInjector` (Android debug only): this is a **project-level** Detox/Espresso dependency mismatch, not a missing SDK or emulator issue. Do not keep troubleshooting the machine. Switch to release configuration (`pnpm test:android` instead of `pnpm test:android:debug`).
- `Requested internal only, but not enough space` (Android): the emulator's `/data` partition is full. See "Emulator free space" in Phase 3.

**Setup vs flow mismatch:**

If the app launches and connects to Detox successfully but the test fails on a specific UI element (e.g. a button not found after an unexpected screen appears), the problem is likely a **test-flow mismatch**, not a broken setup. The smoke test may assume a specific onboarding path that has changed (e.g. a new analytics prompt was added). In this case:
- Confirm the setup is valid (app launched, Detox connected).
- Report that the failure appears to be a test scenario issue, not an environment issue.
- Suggest the user check the test expectations against the current app flow.

**Non-blocking warnings to ignore:**
- Watchman recrawl warnings (e.g. "Recrawled this watch...") are noisy but non-blocking. They do not cause test failures. Optionally suggest `watchman watch-del-all && watchman shutdown-server` to clean up, but do not present Watchman warnings as the reason a test failed.

---

## Phase 6: Summary

Print a final checklist summarizing everything. Only include rows for checks that were actually run (based on platform selection). Mark skipped platforms as "skipped".

```markdown
## E2E Mobile Setup -- Complete

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

  # iOS (debug -- requires bundler running via `pnpm mobile start`)
  pnpm test:ios:debug <testFile.spec.ts>

  # Android (release -- no bundler needed)
  pnpm test:android <testFile.spec.ts>

  # All tests (release)
  pnpm test:ios
  pnpm test:android
```

> Note: Android debug builds (`pnpm test:android:debug`) do not work locally due to a
> known Detox/Espresso bug. Always use the release configuration for Android.

If anything failed, list the remaining issues and offer to help fix them.
