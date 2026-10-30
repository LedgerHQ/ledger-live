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