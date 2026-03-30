---
description: Interactive setup wizard for running desktop E2E (Playwright + Speculos) tests locally
---

# Desktop E2E Onboarding

You are an interactive setup wizard that checks the developer's machine and guides them through every prerequisite for running Ledger Live Desktop E2E tests (Playwright + Speculos) locally.

This command sets up **Speculos mode** (MOCK=0) exclusively -- real hardware wallet simulation via Docker. Mock mode does not require onboarding.

Work through each phase sequentially. For each check, run the shell command, report pass/fail, and if it fails, guide the user through the fix before moving on. Use TodoWrite to track progress across phases.

**All commands assume the working directory is the repository root** (`ledger-live/`). Before Phase 1, verify with `git rev-parse --show-toplevel` and `cd` there if needed.

**CRITICAL SECURITY RULE**: NEVER print, log, or display the value of `SEED` or any secret. Only confirm whether it is set or not.

**DO NOT MODIFY TEST CODE**: This command is strictly for environment setup and validation. Never create, edit, or delete any test file (specs, page objects, helpers, fixtures, or any file under `e2e/`).

---

## Phase 1: System Tools

**Do NOT hardcode expected versions.** Read the source-of-truth config files to determine what's required:

| Tool | Source of truth | How to read                |
| ---- | --------------- | -------------------------- |
| Node | `.prototools`   | `grep "^node" .prototools` |
| pnpm | `.prototools`   | `grep "^pnpm" .prototools` |

First, read the config files to determine expected versions. Then run these checks:

| Check          | Command                        | Expected                                        |
| -------------- | ------------------------------ | ----------------------------------------------- |
| Docker         | `docker --version`             | Installed (required -- Speculos runs in Docker) |
| Docker running | `docker info > /dev/null 2>&1` | Docker Desktop is running                       |
| Proto          | `proto --version`              | Installed (recommended, not required)           |
| Node           | `node --version`               | See version policy below                        |
| pnpm           | `pnpm --version`               | See version policy below                        |

**Node / pnpm version policy:**

`.prototools` is the source of truth for the **recommended** versions. The check should:

- **PASS** if the active version matches the pinned version exactly.
- **WARN** if the active major version matches but the minor/patch differs (e.g. pinned `22.13.1`, active `22.14.0`). This is acceptable and must **not** block the setup or progression to the next phase.
- **FAIL** only if the active major version is different or older than the pinned major version (e.g. pinned Node 22, active Node 20). Only **FAIL** results are hard blockers that must be resolved before proceeding.

Do not fail just because the binary path is not under `~/.proto/`. The version is what matters, not the install method. If Proto is installed, suggest running `proto use` from the repo root to align versions.

**Fix commands for common failures:**

- Docker: Install Docker Desktop from https://www.docker.com/products/docker-desktop/
- Docker not running: Open Docker Desktop and wait for it to start
- Proto: `curl -fsSL https://moonrepo.dev/install/proto.sh | bash` then `proto use` from repo root

**Do not proceed to Phase 2 until all relevant FAIL-level checks are resolved.** WARN-only results (Proto absence, Node/pnpm minor/patch drift) should be surfaced but must not block progression.

---

## Phase 2: Environment Variables

Check each variable is set and valid. Run `[ -n "$VAR" ] && echo "set" || echo "NOT SET"` for each.

| Variable             | Validation                                                    | Default / Guidance                                                                                    |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `MOCK`               | Equals `0` (`[ "$MOCK" = "0" ]`)                              | Must be `0` for Speculos mode                                                                         |
| `COINAPPS`           | Non-empty AND directory exists (`[ -d "$COINAPPS" ]`)         | Path to cloned `coin-apps` repo. If not cloned: `git clone https://github.com/LedgerHQ/coin-apps.git` |
| `SEED`               | Non-empty only (`[ -n "$SEED" ]`). **NEVER print its value.** | See SEED guidance below.                                                                              |
| `SPECULOS_IMAGE_TAG` | Non-empty                                                     | `ghcr.io/ledgerhq/speculos:latest`                                                                    |
| `SPECULOS_DEVICE`    | Non-empty                                                     | `nanoSP` (options: nanoS, nanoSP, nanoX, stax, flex, nanoGen5)                                        |

**Optional variables:**

| Variable                        | Purpose                                 | Default                         |
| ------------------------------- | --------------------------------------- | ------------------------------- |
| `SPECULOS_FIRMWARE_VERSION`     | Firmware version to emulate             | Auto-detected from device model |
| `DISABLE_TRANSACTION_BROADCAST` | Set to `1` to prevent real tx broadcast | Unset (broadcast enabled)       |

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

**coin-apps freshness check:**

If `COINAPPS` is set and the directory exists, check if the repo is up to date:

```bash
cd "$COINAPPS" && git fetch origin master --dry-run 2>&1
```

If the fetch shows new commits, warn the user and suggest:

```bash
cd "$COINAPPS" && git pull origin master
```

Outdated coin-apps is a common cause of Speculos app version mismatches.

**Do not proceed to Phase 3 until all relevant checks pass.**

---

## Phase 3: Docker and Speculos

Verify the Docker + Speculos setup is ready.

### 3a. Docker Desktop running

Run: `docker info > /dev/null 2>&1`

If it fails, Docker Desktop is not running. Guide the user to open it and wait.

### 3b. Pull Speculos image

Run: `docker pull $SPECULOS_IMAGE_TAG`

If the pull fails:

- Check internet connectivity
- Check the image tag is correct
- If behind a proxy, Docker may need proxy configuration

### 3c. Verify Speculos image works

Run: `docker run --rm $SPECULOS_IMAGE_TAG --help`

This should print the Speculos help text. If it fails, the image may be corrupted -- suggest removing and re-pulling:

```bash
docker rmi $SPECULOS_IMAGE_TAG && docker pull $SPECULOS_IMAGE_TAG
```

### 3d. Check for stale Speculos containers

Run: `docker ps -a --filter name=speculos --format "{{.ID}} {{.Names}} {{.Status}}"`

If any containers are listed, they are leftover from previous test runs (likely interrupted with Ctrl+C). Offer to clean them up:

```bash
docker rm -f $(docker ps -a --filter name=speculos -q)
```

Stale containers can cause port conflicts when launching new Speculos instances.

**Do not proceed to Phase 4 until all checks pass.**

---

## Phase 4: Install Dependencies and Build

Run sequentially (check exit codes between each step). All commands from the repo root.

### 4a. Install dependencies

```bash
pnpm i --filter="ledger-live-desktop..." --filter="live-cli..." --filter="ledger-live" --filter="@ledgerhq/dummy-*-app..." --filter="ledger-live-desktop-e2e-tests" --unsafe-perm
```

### 4b. Build lib dependencies

```bash
pnpm build:lld:deps
```

### 4c. Build CLI

```bash
pnpm build:cli
```

### 4d. Build desktop app for testing

```bash
pnpm desktop build:testing
```

This creates a production-like Electron build with `TESTING=1` (uses `.env.testing` Firebase config).

### 4e. Install Playwright browser

```bash
pnpm e2e:desktop test:playwright:setup
```

This installs Chromium for Playwright.

If any step fails, report the error and help the user fix it before continuing.

**Common build failures:**

- OOM: prefix command with `NODE_OPTIONS="--max-old-space-size=10240"`
- Stale build artifacts: `rm -rf apps/ledger-live-desktop/dist` then retry `pnpm desktop build:testing`
- Chromium download fails: check network/proxy, retry `pnpm e2e:desktop test:playwright:setup`
- Dependency conflicts after branch switch: `pnpm clean` then start from step 4a again

---

## Phase 5: Smoke Test

Run a quick test to validate the full Speculos setup:

```bash
pnpm e2e:desktop test:playwright tests/specs/add.account.spec.ts
```

Report whether the test passed or failed. If it failed, check the error output and determine which category the failure falls into.

**GUI environment fallback:**

Electron is a GUI application that requires macOS WindowServer access. The agent shell may not have this access. If the test output contains **any** of these patterns:

- `Process failed to launch!`
- `Cannot read properties of undefined (reading 'getAppPath')`

This is a **GUI environment limitation**, not a setup failure. In this case:

1. Do **not** treat it as a failed setup step.
2. Report that all setup phases (1-4) completed successfully and the environment is ready.
3. Explain that Electron cannot launch from the agent shell due to missing display/WindowServer access.
4. Print the exact command for the user to run in their **Cursor integrated terminal** (not the agent shell):

```
Your E2E environment is fully set up. To validate, paste this command in your Cursor integrated terminal:

  pnpm e2e:desktop test:playwright tests/specs/add.account.spec.ts
```

5. Mark the smoke test as **manual** in the Phase 6 summary (not as a failure).

**Common smoke test failures (real setup issues):**

- "Timeout waiting for selector": app didn't load -- check that `pnpm desktop build:testing` ran successfully, check that the built app exists under `apps/ledger-live-desktop/dist/`
- Docker errors / Speculos container failed to start: check Docker is running (`docker info`), check `COINAPPS` path is correct, check image tag matches a pulled image
- `TypeError: Invalid Version: DS_Store`: `.DS_Store` files in the coin-apps repo are causing semver lookup failures. Fix with: `find $COINAPPS -name ".DS_Store" -type f -delete`
- Speculos app version mismatch / missing nano app: the `coin-apps` repo may be outdated. Pull latest: `cd $COINAPPS && git pull origin master`
- Port conflicts: stale Speculos containers from previous runs. Clean up with: `docker rm -f $(docker ps -a --filter name=speculos -q)`

**Setup vs flow mismatch:**

If the app launches and connects to Speculos successfully but the test fails on a specific UI element (e.g. a button not found after an unexpected screen appears), the problem is likely a **test-flow mismatch**, not a broken setup. In this case:

- Confirm the setup is valid (app launched, Speculos connected, Docker container running).
- Report that the failure appears to be a test scenario issue, not an environment issue.
- Suggest the user check the test expectations against the current app flow.

---

## Phase 6: Summary

Print a final checklist summarizing everything.

Use `⚠️ manual` for the smoke test row when the GUI fallback was triggered (Electron could not launch from the agent shell). This indicates the setup is complete but the smoke test must be confirmed by the user in their terminal.

```markdown
## E2E Desktop Setup -- Complete

| Check                  | Status              |
| ---------------------- | ------------------- |
| Docker                 | ✅ / ❌             |
| Proto / Node / pnpm    | ✅ / ❌             |
| Environment variables  | ✅ / ❌             |
| Speculos image         | ✅ / ❌             |
| Dependencies installed | ✅ / ❌             |
| App built              | ✅ / ❌             |
| Playwright browser     | ✅ / ❌             |
| Smoke test             | ✅ / ❌ / ⚠️ manual |
```

If everything passed, confirm the user is ready to run tests with:

```
You're all set! Run tests from the repo root:

  # All tests
  pnpm e2e:desktop test:playwright

  # Single test file
  pnpm e2e:desktop test:playwright tests/specs/<testFile>.spec.ts

  # Pattern filter
  pnpm e2e:desktop test:playwright --grep "swap"

  # Debugging (Playwright inspector + Ledger Live devtools)
  PWDEBUG=1 DEV_TOOLS=1 pnpm e2e:desktop test:playwright tests/specs/<testFile>.spec.ts

  # Disable transaction broadcast
  DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright tests/specs/<testFile>.spec.ts

  # Generate and view Allure report after a test run
  pnpm e2e:desktop allure
```

If anything failed, list the remaining issues and offer to help fix them.
