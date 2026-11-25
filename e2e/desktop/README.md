# E2E Tests - Desktop

This folder contains the end-to-end (E2E) tests for the **Ledger Wallet Desktop** app.
Dev teams are responsible for **adding/updating tests** when implementing new features.

---

## Interactive Setup (Recommended)

Use the `/e2e-desktop-onboard` skill (from an agent tool that supports repo skills) for a guided walkthrough that checks every
prerequisite, validates your environment, builds the app, and runs a smoke test.

---

To write or review a spec, follow [E2E conventions](../docs/e2e-conventions.md) and [Desktop E2E conventions](docs/e2e-desktop-conventions.md). Then follow [Adding or updating a desktop E2E test](docs/e2e-desktop-add-or-update.md).

## Quick Start

All build and test commands below are run from the **repo root** (`ledger-live/`).

### 1. Prerequisites

- Read the e2e environment [guide](https://ledgerhq.atlassian.net/wiki/spaces/QA/pages/6945013939/Ledger+Wallet+E2E+Environment)❗
- Docker Desktop installed and running (Speculos runs in Docker)
- Pull the Speculos Docker image:

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
export MOCK=0
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
export SPECULOS_DEVICE=nanoSP       # Options: nanoSP | nanoX | nanoS | stax | flex | nanoGen5
export SPECULOS_APP_PROVIDER=1      # Optional: 4 runs pre-release apps, falling back to 1 for apps it doesn't publish
```

Consider adding these exports to your profile so they persist.

### 3. Build

Before running tests, build the app and dependencies:

```bash
pnpm i --filter="ledger-live-desktop..."  --filter="live-cli..." --filter="ledger-live" --filter="ledger-live-desktop-e2e-tests" --unsafe-perm
pnpm build:lld:deps
pnpm desktop build:testing
```

> 🔹 Run this whenever the source code changes.

Install Playwright dependencies:

```bash
pnpm e2e:desktop test:playwright:setup
```

### 4. Run Tests

- Run all tests

```bash
pnpm e2e:desktop test:playwright
```

- Run a single test

```bash
pnpm e2e:desktop test:playwright <testFileName>
```

## Ledger Wallet Desktop Wiki

For detailed setup, debugging, and contribution guidelines, see:
[Ledger Wallet Desktop E2E Wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLD:E2ETesting)

## Filtering Tests

To run only selected specs when dispatching an E2E workflow, see
[Using `test_filter` in the E2E workflows](../tooling/filter/test-filter-guide.md).

## Remote Speculos (Speculinho)

Tests run on a local Docker Speculos by default. To run them on remote Speculos instances instead, for example to debug a CI run, see the
[Speculinho guide](../../libs/live-e2e-shared/SPECULINHO.md).

To watch the device screen during a local run, on Docker or Speculinho, set `SPECULOS_SCREEN`: see
[Watch the device](../../libs/live-e2e-shared/SPECULINHO.md#watch-the-device).

## Pay tab

Pay tab specs need `BAANX_TEST_CLIENT_KEY`, `BAANX_TEST_USER_EMAIL`, `BAANX_TEST_USER_PASSWORD`, and `BAANX_TEST_USER_TOTP_SECRET` environment variables. See [@ledgerhq/baanx-test-client](../tooling/baanx-test-client/README.md).

A spec that needs an injected Card session must live under `tests/specs/paytab/`. The card-session reporter
mints once before workers when a selected spec path contains `/paytab/`. `--grep` is already applied,
so a smoke run that does not select that spec does not log in. The fixture injects the session when
the spec path contains `/paytab/`. A Pay tab spec anywhere else launches signed out.

## App upgrade

`tests/specs/app.upgrade.spec.ts` upgrades between the two latest published builds of the branch's
channel: from the previous one (n-1) to the latest one (n). It adds an account and changes the
counter value and theme on n-1, then opens the same profile with n and checks all three are kept.
It runs on Linux and macOS.

The channel comes from the app version of the branch under test:

| Branch               | App version      | Channel   | Example                                                            |
| -------------------- | ---------------- | --------- | ------------------------------------------------------------------ |
| `release`            | `X.Y.Z-next.N`   | `next`    | `4.30.0-next.0` -> `4.30.0-next.1`                                 |
| `hotfix`             | `X.Y.Z-hotfix.N` | `hotfix`  | `4.26.0-next.2` -> `4.26.1-hotfix.0`                               |
| `develop` and others | `X.Y.Z`          | `nightly` | `4.30.0-nightly.20261121020412` -> `4.30.0-nightly.20261124020210` |

Production builds are a separate app, so a prerelease never upgrades from one.

The latest build of a channel comes from its `download.live.ledger.com` update manifest
(`next-mac.yml`, `nightly-linux.yml`…). Neither the manifests nor the buckets list earlier builds,
so n-1 is found by checking which versions have a published checksum:

- **Prereleases** are numbered from 0 for each version: n-1 is the previous number. For the first
  prerelease of a version, it is the last prerelease of the version before, on the same channel or
  else on the other one: the first hotfix starts from the release candidate it fixes.
- **Nightlies** are stamped with their build time: n-1 comes from the public runs of the nightly
  workflow (`release-final-nightly.yml`), from the time its `snapshot versioning` step ran. Nights
  without a nightly (Sunday and Monday) are skipped.

Builds that were never published, such as failed ones, are skipped. Each build is checked against
its published SHA-512 and cached under `tests/artifacts/published-builds/`. After each launch, the
test checks the app reports the expected version. The report shows both versions in its step names.

Two environment variables, or the `upgrade_from_version` and `upgrade_to_version` inputs of the
desktop E2E workflow, pick other versions:

- `E2E_UPGRADE_TO_VERSION`: a channel (`nightly`, `next` or `hotfix`) for its latest build, an exact
  version (`4.30.0-next.1`), or `local` for the build under test. Default: the branch's channel.
- `E2E_UPGRADE_FROM_VERSION`: `previous` (default: the version before the one it upgrades to, or the
  latest build of the branch's channel when it upgrades to `local`), a channel, or an exact version.

```bash
E2E_UPGRADE_TO_VERSION=local pnpm e2e:desktop test:playwright app.upgrade
```

## Feature Flags

### E2E_FEATURE_FLAGS_JSON

Set `E2E_FEATURE_FLAGS_JSON` to inject flags for the run. To understand the format and how feature flags resolve, refer to [Feature Flags](../docs/e2e-conventions.md#feature-flags).

### Feature Flag presets

It is possible to choose an optional Feature Flag set for the test run.

Set the env var to the desired value, for example:

```bash
export E2E_DESKTOP_FEATURE_FLAGS="some-preset"
```

Or use the "Choose a feature flag set" options dropdown on the GitHub workflow.

See the `ffPresetMap` in `tests/utils/featureFlagUtils.ts` for available presets.

## Typecheck

Run `pnpm nx typecheck ledger-live-desktop-e2e-tests` to typecheck building workspace libraries first. `pnpm typecheck` in this directory checks the built `lib/` and reports false errors when `libs/live-e2e-shared/src` is newer than that build.

## Soft assertions

Soft assertions can be useful for gathering more feedback in a single test run.

Read the [soft-expect docs](./docs/soft-expect.md) for examples and more.