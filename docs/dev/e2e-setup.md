# E2E Setup Reference

Shared reference for E2E environment setup (desktop and mobile).

---

## System Tools — Version Source of Truth

**Do NOT hardcode expected versions.** Read config files first:

| Tool | Source of truth | How to read |
|------|----------------|-------------|
| Node | `.prototools` | `grep "^node" .prototools` |
| pnpm | `.prototools` | `grep "^pnpm" .prototools` |
| Java | `apps/ledger-live-mobile/android/build.gradle` | Look for `JavaVersion.VERSION_XX` in `sourceCompatibility` |
| Android SDK API | `apps/ledger-live-mobile/android/build.gradle` | Look for `compileSdkVersion` |
| Ruby | No pinned version in repo | Just check `ruby --version` returns >= 3.0 |
| Xcode | No pinned version in repo | Just check `xcodebuild -version` returns a recent version |

---

## System Checks

### Common checks (always run)

| Check  | Command                        | Expected |
|--------|--------------------------------|----------|
| Docker | `docker --version`             | Installed |
| Docker running | `docker info > /dev/null 2>&1` | Docker Desktop is running. **Note:** this command requires Docker socket access — it may return a false negative when run from a sandboxed agent shell even if Docker is actually running. If it fails, ask the user to confirm Docker Desktop is open before treating it as a FAIL. |
| Proto  | `proto --version`              | Installed (recommended, not required) |
| Node   | `node --version`               | See version policy below |
| pnpm   | `pnpm --version`               | See version policy below |

### iOS checks (skip if Android only)

| Check           | Command               | Expected |
|-----------------|-----------------------|----------|
| Xcode CLI tools | `xcode-select -v`     | Installed |
| Xcode version   | `xcodebuild -version` | Recent stable version |
| Ruby            | `ruby --version`      | >= 3.0 (Homebrew, rbenv, asdf, system — any install method) |
| Bundler         | `bundle --version`    | Installed (needed for CocoaPods in this repo) |
| applesimutils   | `which applesimutils` | Installed |

**Ruby validation note:** Check the version number, not the path. Do not fail because `which ruby` points to a non-Homebrew location. Requirement: Ruby >= 3.0 and `bundle` available. Optionally check `bundle exec pod --version` from `apps/ledger-live-mobile`.

### Android checks (skip if iOS only)

| Check                 | Command                                      | Expected |
|-----------------------|----------------------------------------------|----------|
| Java                  | `java -version`                              | Major version matching `build.gradle` `JavaVersion` |
| Android SDK           | `echo $ANDROID_HOME`                         | Non-empty, directory exists |
| Android emulator      | `$ANDROID_HOME/emulator/emulator -list-avds` | At least one AVD |
| sdkmanager (optional) | `command -v sdkmanager` or check known paths | Available (nice-to-have, not required for running tests) |

**sdkmanager path note:** May be at `$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager`, or a Homebrew path. Accept any. If not found at all, this is a **warning** — only needed to install new SDK components.

---

## Node / pnpm Version Policy

`.prototools` is the source of truth for **recommended** versions:

- **PASS** — active version matches pinned version exactly
- **WARN** — active major matches but minor/patch differs (e.g. pinned `22.13.1`, active `22.14.0`). Acceptable, must **not** block progression.
- **FAIL** — active major version is different or older (e.g. pinned Node 22, active Node 20). Hard blocker.

Do not fail because the binary path is not under `~/.proto/`. Version is what matters. If Proto is installed, suggest `proto use` from repo root.

---

## Fix Commands

| Tool | Fix |
|------|-----|
| Docker | Install Docker Desktop from https://www.docker.com/products/docker-desktop/ |
| Docker not running | Open Docker Desktop and wait for it to start |
| Proto | `curl -fsSL https://moonrepo.dev/install/proto.sh \| bash` then `proto use` from repo root |
| Xcode CLI | `xcode-select --install` |
| Ruby | Install via preferred method (Homebrew, rbenv, asdf) — ensure version >= 3.0 |
| applesimutils | `brew tap wix/brew && brew install applesimutils` |
| Java | `brew install openjdk@<version>` (use version from `build.gradle`) |
| Android SDK / `ANDROID_HOME` | Add to `~/.zshrc`: |

```bash
export JAVA_HOME=$(/usr/libexec/java_home)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

---

## Environment Variables

Check each variable with: `[ -n "$VAR" ] && echo "set" || echo "NOT SET"`

### Common variables (always check)

| Variable             | Validation                                                    | Default / Guidance |
|----------------------|---------------------------------------------------------------|--------------------|
| `SEED`               | Non-empty only (`[ -n "$SEED" ]`). **NEVER print its value.** | Ask the team for guidance. |
| `MOCK`               | Equals `0` (`[ "$MOCK" = "0" ]`)                              | Must be `0` for Speculos mode |
| `COINAPPS`           | Non-empty AND directory exists (`[ -d "$COINAPPS" ]`)         | Path to cloned `coin-apps` repo. If not cloned: `git clone https://github.com/LedgerHQ/coin-apps.git` |
| `SPECULOS_IMAGE_TAG` | Non-empty                                                     | `ghcr.io/ledgerhq/speculos:latest` |
| `SPECULOS_DEVICE`    | Non-empty                                                     | Desktop: `nanoSP` / Mobile: `nanoX` (options: nanoS, nanoSP, nanoX, stax, flex, nanoGen5) |

### Optional variables

| Variable                        | Purpose                                 | Default |
|---------------------------------|-----------------------------------------|---------|
| `SPECULOS_FIRMWARE_VERSION`     | Firmware version to emulate             | Auto-detected from device model |
| `DISABLE_TRANSACTION_BROADCAST` | Set to `1` to prevent real tx broadcast | Unset (broadcast enabled) |

### Android variables (skip if iOS only)

| Variable       | Validation                     | Default / Guidance |
|----------------|--------------------------------|--------------------|
| `JAVA_HOME`    | Non-empty AND directory exists | `$(/usr/libexec/java_home)` |
| `ANDROID_HOME` | Non-empty AND directory exists | `$HOME/Library/Android/sdk` |

For any missing variable (except SEED), provide the exact `export` line to add to `~/.zshrc`.
