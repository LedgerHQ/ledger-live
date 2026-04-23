# E2E Tests - Desktop

This folder contains the end-to-end (E2E) tests for the **Ledger Wallet Desktop** app.  
Dev teams are responsible for **adding/updating tests** when implementing new features.

---

## Interactive Setup (Recommended)

Use the Cursor command `/e2e-desktop-onboard` for a guided, interactive walkthrough that checks every prerequisite, validates your environment, builds the app, and runs a smoke test.

---

## Quick Start

All build and test commands below are run from the **repo root** (`ledger-live/`).

### 1. Prerequisites

- Ledger Live repository (as mentioned in the full wiki)
- Read the e2e environment [guide](https://ledgerhq.atlassian.net/wiki/spaces/QA/pages/6945013939/Ledger+Wallet+E2E+Environment)❗
- Docker Desktop installed and running (Speculos runs in Docker)
- Pull the Speculos Docker image:

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
export MOCK=0
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
export SPECULOS_DEVICE=nanoSP       # Options: nanoSP | nanoX | nanoS | stax | flex | nanoGen5
```

Consider adding these exports to your profile so they persist.

### 3. Build

Before running tests, build the app and dependencies:

```bash
pnpm i --filter="ledger-live-desktop..."  --filter="live-cli..." --filter="ledger-live" --filter="@ledgerhq/dummy-*-app..." --filter="ledger-live-desktop-e2e-tests" --unsafe-perm
pnpm build:lld:deps
pnpm build:cli
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

### 5. Full Documentation

For detailed setup, debugging, and contribution guidelines, see:
[Ledger Wallet Desktop E2E Wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLD:E2ETesting)

### 6. Wallet 4.0

The Wallet 4.0 feature is ON by default (regardless of Firebase).
You can force Wallet 4.0 OFF (legacy) by setting the E2E environment variable:

```bash
export E2E_ENABLE_WALLET40=0
```

Individual tests can still switch Wallet 4.0 OFF by explicitly passing the `LWD_WALLET_40_FF_DISABLED` FF.

To switch Wallet 4.0 OFF on CI please untick the checkbox on the Github Workflow.

### 7. Custom feature flags with E2E_FEATURE_FLAGS_JSON

You can inject extra feature flags globally for Desktop E2E by setting `E2E_FEATURE_FLAGS_JSON`.

Example shape:

```json
{
  "myFeature": {
    "enabled": true,
    "params": {
      "foo": "bar"
    }
  }
}
```

Usage examples:

```bash
# Enable one feature with params
export E2E_FEATURE_FLAGS_JSON='{"myFeature":{"enabled":true,"params":{"foo":"bar"}}}'

```

Notes:

- Arrays, scalars, or invalid JSON are rejected.
- `E2E_FEATURE_FLAGS_JSON` is merged with default E2E flags.
- Per-test `featureFlags` fixture values still override env-provided values when both set the same key.
