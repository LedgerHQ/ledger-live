# tools/

Infrastructure and tooling layer for the Ledger Wallet monorepo. This directory contains no business logic — only CI/CD automation (GitHub Actions), Nx configuration plugins, build utilities, and pnpm hook helpers used across all packages and apps.

## Contents

| Directory | Purpose |
|---|---|
| [`actions/`](#actions) | All GitHub Actions for CI/CD pipelines |
| [`create-release-hash/`](#create-release-hash) | SHA-512 checksum generator for desktop release binaries |
| [`nx-plugins/`](#nx-plugins) | Nx project graph plugins (auto-tagging, boundary enforcement) |
| [`nx/`](#nx) | Nx cache config generation and build-dep chunking utilities |
| [`pnpm-utils/`](#pnpm-utils) | pnpm `.pnpmfile.cjs` hook helpers |
| [`scripts/`](#scripts) | Shell scripts for monorepo history migration and Android emulator CI |

---

## actions/

All GitHub Actions used in CI/CD. Custom JavaScript actions are built with [rslib](https://lib.rsbuild.dev/) (TypeScript → CJS, committed pre-built). Composite actions are pure YAML and require no build step.

### Custom JavaScript Actions

#### `build-checks`

Compares desktop and mobile bundle sizes and duplicate package counts between a PR and the base branch; posts a summary comment on the PR.

- **Desktop mode:** Downloads the most recent `linux-js-bundle-metafiles` artifact from the base branch, compares against current Linux/Mac/Win metafiles. Flags cross-platform inconsistencies (> 100 KB threshold) and size regressions/improvements.
- **Mobile mode:** Compares `main.ios.jsbundle` and `main.android.jsbundle` sizes from `mobile.metafile.json`.
- Supports both esbuild and rspack metafile formats.
- A local CLI (`pnpm cli path/to/metafile.json renderer`) runs the analysis outside CI.

```bash
pnpm --filter @actions/build-checks build
pnpm --filter @actions/build-checks test
```

#### `change-product-name`

Appends a suffix (default: `Beta`) to the `productName` field of a `package.json`. Used to stamp desktop builds as beta.

#### `desktop-report-build`

Generates a Markdown build status summary for cross-platform desktop builds (Linux, Windows, macOS), outputting `summary-build-desktop.json`.

#### `generate-release-message`

Reads a `CHANGELOG.md` and extracts the entry for the current package version (from `package.json`), writing it as a standalone Markdown file.

#### `get-package-infos`

Reads a `package.json` and exposes version, prerelease flag, and release channel (`next`, `beta`, etc.) as GitHub Actions outputs.

#### `live-common-affected`

Determines which coin families or integration test paths are affected by git changes (comparing a ref to HEAD), for targeted re-runs of coin integration tests.

#### `prepare-comment-screenshots`

Formats screenshot diff data (actual/diff/expected trios) into a collapsible Markdown PR comment body.

#### `submit-bot-report`

Posts integration test bot reports (`full-report.md`, `github-report.md`) to a GitHub PR comment and optionally sends a Slack message.

#### `upload-images`

Recursively scans a directory for `.png` files, uploads them to AWS S3 (`eu-west-1`), and returns a JSON manifest of public URLs grouped into `{ actual, diff, expected }` trios.

### Composite Actions

YAML-only composite actions covering the full CI lifecycle:

| Composite | Purpose |
|---|---|
| `adjust-changeset-level` | Rewrites changeset bump levels (e.g. `patch` → `minor`) in all `.changeset/*.md` files |
| `aggregate-shard-results` | Aggregates up to 12 shard pass/fail/missing statuses into a single result |
| `boot-ios-simulators-background` | Boots iOS simulators for E2E tests |
| `cache/download` / `cache/exists` / `cache/upload` | Low-level S3 cache operations for CI artifact caching |
| `check-branch` | Checks whether a named branch exists in a GitHub repo |
| `ci-flake-notifier` | Posts a Slack notification on known CI flakes; optionally halts the runner for debugging |
| `configure-nx-remote-cache-profile` | Single source of truth for Nx S3 cache key prefix and OIDC role selection; calls `tools/nx/write-nx-cache-config.mjs` |
| `create-branch` / `create-or-update-tag` / `generate-tag` / `merge-branch` | Git automation for release workflows |
| `duplicate-avd` | Duplicates Android Virtual Device configs for parallel emulator runs |
| `generate-shards-matrix` | Computes iOS/Android test shard matrices (up to 12 Android, up to 12 iOS), including per-shard timeout calculation |
| `get-allure-summary` / `get-failed-tests-summary` | Retrieves test run summaries from Allure reports |
| `jfrog-npm-auth` | Configures npm auth for JFrog Artifactory |
| `merge-e2e-detox-timings` | Merges Detox timing data across shards for intelligent test distribution |
| `monitor` | Monitors CI job resource usage during runs |
| `nx-affected-packages` | Runs `nx show projects --affected` and resolves each project to its filesystem path |
| `nx-step` | Thin wrapper to run an Nx command with optional `NX_SKIP_NX_CACHE=true` |
| `run-coin-tester` | Sets up and runs coin tester integration tests for a specific coin family |
| `run-e2e-playwright-tests` | Full desktop E2E runner: builds grep filter, supports sharding/repeat, runs via `xvfb-run`, writes pass/fail/flaky counts to step summary |
| `setup-android-avd` / `setup-android-env` | Android emulator setup: JDK (Zulu 17), Android SDK, KVM acceleration |
| `setup-build-desktop` | Full desktop build setup: pnpm filter install, version stamp, beta product name |
| `setup-caches` | Master cache composite: mise, pnpm S3 cache, CocoaPods, Nx remote cache, AWS OIDC |
| `setup-coin-tester-env` / `setup-e2e-env` / `setup-e2e-test-desktop` / `setup-test-desktop` | Various E2E and test environment setup |
| `setup-git-user` | Configures git to use the `live-github-bot[bot]` service account |
| `setup-speculos_image` | Pulls/configures the Speculos hardware wallet simulator Docker image |
| `update-snapshots-desktop` | Commits and pushes updated Playwright snapshots after `/generate-screenshots` |
| `upload-allure-report` | Uploads Allure results (with PNG compression) to `ledger-live.allure.green.ledgerlabs.net` |
| `upload-allure-report-qaa` | Uploads Allure results to the QAA Allure 3 portal via multipart POST |
| `validate-changesets` | Validates all `.changeset/*.md` files for correct format and known package names |
| `vercel-deploy` | Deploys to Vercel for preview deployments |

---

## create-release-hash

**Package:** `@ledgerhq/create-release-hash`

Generates a `<name>-<version>.sha512sum` file containing SHA-512 checksums for all desktop release binaries in `dist/`. Run from the desktop app root after electron-builder produces release artifacts.

```bash
pnpm create-release-hash
```

Expected `dist/` layout:

```
dist/
  <name>-<version>-linux-x86_64.AppImage
  <name>-<version>-mac.dmg
  <name>-<version>-mac.zip
  <name>-<version>-win-x64.exe
```

---

## nx-plugins/

Nx project graph plugins used by `nx.json`. Both plugins are plain JavaScript (no build step).

### `project-tags/`

Automatically infers and injects Nx project tags from each package's filesystem path, eliminating manual `tags` maintenance in every `project.json`.

Implements `createNodesV2` (Nx Plugin V2 API). Tag inference rules:

| Path / package | Tags |
|---|---|
| `libs/*` | `scope:libs`, `scope:libs-non-ui` |
| `libs/ui/*` | `scope:libs`, `scope:libs-ui` |
| `libs/coin-modules/*` or `@ledgerhq/coin-*` | `type:coin-module` |
| `libs/coin-tester*` | `type:coin-tester` |
| `domain/entity/*` | `scope:domain`, `type:domain-entity` |
| `domain/api/*` | `scope:domain`, `type:domain-api` |
| `features/platform/*` | `scope:features`, `type:feature-platform` |
| `features/flow/*` | `scope:features`, `type:feature-flow` |
| `shared/*` | `scope:shared` |
| `devtools/*` | `scope:devtools` |
| `tools/*` | `scope:tools` |
| `apps/ledger-live-desktop` | `scope:apps`, `type:app-desktop` |
| `apps/ledger-live-mobile` | `scope:apps`, `type:app-mobile` |
| anything outside `apps/` | `scope:no-apps` |

Run the tests with:

```bash
node --test tools/nx-plugins/project-tags/plugin.test.js
```

### `enforce-boundaries/`

Validates architectural layering rules for the new monorepo architecture (`domain/`, `shared/`, `features/`). Runs as an Nx target and as a standalone Node.js script.

**Dependency constraints (new-arch packages only):**

| Source | May depend on |
|---|---|
| `scope:shared` | `scope:shared` |
| `scope:domain` | `scope:domain`, `scope:shared` |
| `scope:features` | `scope:features`, `scope:domain`, `scope:shared` |
| `type:domain-entity` | `type:domain-entity`, `scope:shared` |
| `type:domain-api` | `type:domain-entity`, `type:domain-api`, `scope:shared` |
| `type:feature-platform` | `type:feature-platform`, `scope:domain`, `scope:shared` |
| `type:feature-flow` | `type:feature-flow`, `type:feature-platform`, `scope:domain`, `scope:shared` |

Legacy packages (`libs/`, `apps/`, `tools/`) are unconstrained during migration.

```bash
# Via Nx (cacheable)
pnpm nx run enforce-boundaries:lint:boundaries

# Standalone
node tools/nx-plugins/enforce-boundaries/validate.js

# Tests
node --test tools/nx-plugins/enforce-boundaries/validate.test.js
```

---

## nx/

Standalone Node.js ES module utilities for Nx. No package.json — run directly with Node.

### `write-nx-cache-config.mjs`

Generates the gitignored `nx.cache-config.json` by merging `nx.workspace.json` + `nx.s3.defaults.json` + a computed `cacheKeyPrefix`.

- Defaults to `"local"` on developer machines; CI uses `"develop"` or `"branch"`.
- Skips the write if the file already exists (use `--force` to overwrite).
- Called automatically on `pnpm install` via the `prepare` hook and by the `configure-nx-remote-cache-profile` composite action.

```bash
node tools/nx/write-nx-cache-config.mjs --cache-key-prefix develop
node tools/nx/write-nx-cache-config.mjs --force
```

### `print-build-dep-chunks.mjs`

Splits a project's transitive build-dependency graph into N comma-separated chunks for parallelizing Nx cache warming. Solves `EMFILE` crashes on Windows caused by unbounded concurrent file reads when warming large dependency graphs.

```bash
# Generate the graph first
pnpm nx graph --focus=ledger-live-desktop --file=/tmp/graph.json

# Print 2 chunks (default)
node tools/nx/print-build-dep-chunks.mjs /tmp/graph.json ledger-live-desktop

# Print 3 chunks
node tools/nx/print-build-dep-chunks.mjs /tmp/graph.json ledger-live-desktop 3
```

---

## pnpm-utils/

**Package:** `@ledgerhq/pnpm-utils`

Helper functions for use in the workspace root `.pnpmfile.cjs` (`hooks.readPackage`). Allows programmatically adding, removing, or overriding dependencies across packages during `pnpm install`.

**Exported API:**

| Function | Description |
|---|---|
| `addDependencies(filter, deps, opts?)` | Adds deps to `pkg.dependencies` for packages matching `filter` (string or RegExp) |
| `addDevDependencies(filter, deps, opts?)` | Same as above for `devDependencies` |
| `addPeerDependencies(filter, deps, opts?)` | Same as above for `peerDependencies`; marks each as `optional: true` in `peerDependenciesMeta` |
| `removeDependencies(filter, deps, opts?)` | Removes named deps from matching packages |
| `process(fns, pkg, context)` | Runs an array of hook functions sequentially against a package |

**Example `.pnpmfile.cjs`:**

```js
const { addDependencies, process } = require('./tools/pnpm-utils');

module.exports = {
  hooks: {
    readPackage(pkg, context) {
      process([
        addDependencies('some-package', { 'peer-dep': '^1.0.0' }),
      ], pkg, context);
      return pkg;
    }
  }
};
```

---

## scripts/

Shell scripts for monorepo history migration and Android emulator CI management.

### Android Emulator Scripts

Used in mobile E2E CI to manage Android Virtual Devices.

| Script | Purpose |
|---|---|
| `boot-android-emulators-ci.sh` | Starts 3 AVDs in parallel, waits for boot, disables UI animations |
| `cleanup-android-emulators.sh` | Kills all running emulators and removes stale `.lock` files |
| `patch-avd-config.sh <avd-name>` | Normalizes an AVD's `config.ini` for headless CI (disables cameras, removes sdcard) |
| `wait_emulator_idle.sh` | Polls `adb shell uptime` until load average drops below 0.9 (30-min timeout) |

### Monorepo History Scripts

Historical scripts used when the monorepo was first assembled from separate repositories. No longer used in regular development.

| Script | Purpose |
|---|---|
| `monorepo.sh <target>` | Merges multiple repos into one monorepo using git subtree, preserving full history |
| `merge_branch.sh <origin> <branch>` | Adds a single branch from a remote into the monorepo via `git merge -s subtree` |
| `sync_remotes.sh` | Fetches and merges all remotes into `main` and `develop` |
