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
- Docker Desktop installed and running (Speculos runs in Docker)
- Clone the CoinApps repository:

```bash
# HTTPS
git clone https://github.com/LedgerHQ/coin-apps.git

# OR SSH
git clone git@github.com:LedgerHQ/coin-apps.git
```

- Pull Speculos Docker image:

```bash
docker pull ghcr.io/ledgerhq/speculos:latest
```

> ⚠️ Adjust repository paths according to your local setup.

### 2. Environment Variables

Set the following environment variables before running tests:

```bash
export MOCK=0
export COINAPPS="/path/to/coin-apps"
export SEED="your 24 word ledger recovery phrase here"
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
export SPECULOS_DEVICE=nanoSP       # Options: nanoSP | nanoX | nanoS | stax | flex | nanoGen5
```

> ⚠️ Replace placeholders with your local paths and credentials.

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
