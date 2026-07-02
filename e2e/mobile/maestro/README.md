# Maestro POC — ledger-live-mobile E2E

A proof-of-concept evaluating **[Maestro](https://docs.maestro.dev)** as a replacement for Detox for
mobile E2E, reusing the existing `e2e/mobile` backend (websocket bridge + Speculos) for state seeding.
It ports three Detox specs to Maestro YAML: ETH add-account, send DOGE, and ETH→USDT swap.

## Quick start — ETH→USDT swap

```bash
# 1. Install Maestro (once)
curl -fsSL "https://get.maestro.mobile.dev" | bash

# 2. Build the app (once)
pnpm e2e:mobile build:ios:debug

# 3. Generate pre-seeded account data (once, needs SEED + local Speculos running)
SEED="<mnemonic>" npx ts-node --swc e2e/mobile/maestro/gen-swap-userdata.ts

# 4. Kill Metro — swap tests use the embedded bundle, Metro interferes
pkill -f "react-native/scripts/packager" || true

# 5. Boot a simulator
maestro start-device --platform ios

# 6. Run the test
SEED="<mnemonic>" SPECULINHO_URL=https://<speculinho-host> \
  bash e2e/mobile/maestro/run-swap.sh eth-usdt
```

> **Remote Speculos (Speculinho)** is the default and the reliable path for swap signing.
> It requires `SPECULINHO_URL` (Ledger internal, needs VPN).
> For local Docker instead: add `REMOTE_SPECULOS=false COINAPPS=/path/to/coin-apps`.

---

## Prerequisites

| Tool | Min version | Install |
|------|-------------|---------|
| **Maestro** | latest | `curl -fsSL "https://get.maestro.mobile.dev" \| bash` |
| **Java** | 17+ | `brew install openjdk@17` or use Android Studio's bundled JDK |
| **Docker** | any | [docker.com](https://www.docker.com/products/docker-desktop/) — only for local Speculos |
| **Node / pnpm** | repo `.nvmrc` | already required by the repo |

> **Maestro also needs Java 17+** at runtime. If `java -version` fails, the run scripts will try
> the Android Studio bundled JRE automatically. Set `JAVA_HOME` manually if needed.

Pull the Speculos image once (local mode only):

```bash
docker pull ghcr.io/ledgerhq/speculos:latest
```

---

## Layout (Nested Flows)

```
maestro/
├── config.yaml                     # workspace config (flows/ are the test cases)
├── flows/                          # test cases — each is an ordered runFlow of subflows
│   ├── add-account-eth.yaml
│   ├── send-doge.yaml
│   ├── smoke-launch.yaml           # seed-only smoke (no Speculos)
│   └── swap/                       # one thin wrapper per pair (tags + runFlow ../../subflows/swap.yaml)
│       ├── btc-eth.yaml
│       ├── eth-usdt.yaml
│       └── ... (14 pairs: <from>-<to>.yaml)
├── subflows/                       # reusable, parameterized building blocks (Nested Flows)
│   ├── launch.yaml                 # launchApp with the seed launch args
│   ├── dismiss-analytics-prompt.yaml
│   ├── open-add-account.yaml
│   ├── modular-drawer-pick.yaml    # env SEARCH/ASSET_ID/NETWORK_ID/NETWORK_REQUIRED/PICK_ACCOUNT
│   ├── swap.yaml                   # generic swap (env FROM_*/TO_*); reused by every flows/swap/*.yaml
│   ├── add-discovered-account.yaml # env ACCOUNT_NAME
│   ├── open-asset-assert-balance.yaml  # env ASSET_ID/TITLE_ID
│   ├── enter-recipient.yaml        # env RECIPIENT
│   ├── enter-amount.yaml           # env AMOUNT
│   ├── choose-fee-and-continue.yaml    # env FEE
│   └── await-ondevice-success.yaml # env SUCCESS_ID
├── scripts/                        # onFlowStart JS hooks (backend reachability, fetch send params)
├── harness/                        # reuses e2e/mobile bridge + Speculos seeding (plain ts-node daemon)
│   ├── main.ts                     # harness entry point
│   └── setup-globals.ts            # recreates jest globals outside jest
├── reporting/
│   └── maestro-to-allure.mjs      # converts Maestro XML output to Allure JSON
├── gen-swap-userdata.ts            # local dev helper: pre-generates e2e/userdata/generated/ethereum.json
├── run.sh                          # generic runner (used by CI for add-account / send-doge)
├── run-eth.sh                      # ETH add-account orchestrator
├── run-send-doge.sh                # send DOGE orchestrator
├── run-swap.sh                     # swap orchestrator (all pairs or one)
└── _platform.sh                    # platform-aware helpers (iOS sim / Android emulator)
```

---

## Build the app (once)

```bash
# iOS debug build (appId: com.ledger.live.debug)
pnpm e2e:mobile build:ios:debug

# Start Metro in a separate terminal (required for iOS Debug mode):
pnpm mobile start

# Boot a simulator (Maestro needs a running device):
maestro start-device --platform ios
# — or open Simulator.app and boot an iPhone manually
```

---

## Run: ETH add-account

```bash
# Full run (Speculos-backed, local Docker):
SEED="<test mnemonic>" bash e2e/mobile/maestro/run-eth.sh

# Seed-only smoke (no Speculos, no Docker):
MAESTRO_FULL=0 bash e2e/mobile/maestro/run-eth.sh

# Pass extra args to `maestro test` (e.g. target a specific device):
SEED="..." bash e2e/mobile/maestro/run-eth.sh -d <udid>

# Remote Speculos (Speculinho — no Docker, needs VPN):
SEED="..." REMOTE_SPECULOS=true SPECULINHO_URL=https://<speculinho-host> \
  bash e2e/mobile/maestro/run-eth.sh
```

**Key env vars (`run-eth.sh`)**

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED` | *(required for full run)* | BIP39 mnemonic used by Speculos |
| `MAESTRO_FULL` | `1` | `0` = skip Speculos (smoke only) |
| `REMOTE_SPECULOS` | `false` | `true` = remote Speculinho (no Docker) |
| `SPECULINHO_URL` | *(required if remote)* | Speculinho operator base URL |
| `MAESTRO_BRIDGE_PORT` | `8099` | WebSocket bridge port |
| `E2E_ENABLE_WALLET40` | `0` | `1` = Wallet 4.0 UI |
| `SPECULOS_DEVICE` | `nanoX` | Speculos hardware model |

---

## Run: swap

```bash
# All pairs (uses retries, default MAESTRO_RETRIES=2):
SEED="<test mnemonic>" SPECULINHO_URL=https://<host> bash e2e/mobile/maestro/run-swap.sh

# One pair:
SEED="..." SPECULINHO_URL=https://<host> bash e2e/mobile/maestro/run-swap.sh eth-usdt

# Local Docker Speculos (needs COINAPPS):
SEED="..." REMOTE_SPECULOS=false COINAPPS=/path/to/coin-apps \
  bash e2e/mobile/maestro/run-swap.sh btc-eth

# Disable retries:
MAESTRO_RETRIES=0 SEED="..." ... bash e2e/mobile/maestro/run-swap.sh eth-usdt
```

**Key env vars (`run-swap.sh`)**

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED` | *(required)* | BIP39 mnemonic |
| `REMOTE_SPECULOS` | `true` | `false` = local Docker (needs `COINAPPS`) |
| `SPECULINHO_URL` | *(required if remote)* | Speculinho operator base URL |
| `COINAPPS` | *(required if local)* | Path to a coin-apps clone |
| `MAESTRO_RETRIES` | `2` | Retries after first attempt (0 = disabled, 2 = up to 3 attempts) |
| `E2E_GENERATED_USERDATA_DIR` | `<repo>/e2e/userdata/generated` | Pre-generated account data directory |
| `LEDGER_LIVE_CLI_BIN` | *(auto-detected)* | Override CLI binary path (see [CLI fallback](#cli-fallback)) |
| `DISABLE_TRANSACTION_BROADCAST` | `1` | `0` = broadcast for real |
| `SWAP_API_BASE` | staging URL | Swap API endpoint |
| `E2E_ENABLE_WALLET40` | `1` | `0` = classic portfolio UI |
| `MAESTRO_BRIDGE_PORT` | `8099` | WebSocket bridge port |

**Available swap pairs** (each needs a `flows/swap/<pair>.yaml`):

```
btc-eth  eth-btc  eth-usdt  usdt-eth  sol-btc  xrp-btc  ...  (14 total)
```

---

## Pre-generated userdata

The swap harness seeds ETH account data from a **pre-generated JSON file** instead of running a
full Speculos derivation for the debit account. This makes setup faster and removes a common
failure mode (Speculos contention during account seeding).

```bash
# Generate locally (requires Speculos running + SEED set):
SEED="<mnemonic>" npx ts-node --swc e2e/mobile/maestro/gen-swap-userdata.ts
# → writes e2e/userdata/generated/ethereum.json
```

In CI, the file is restored from an S3 cache (key `e2e-userdata-mobile-<YYYY-MM-DD>`). The
`E2E_GENERATED_USERDATA_DIR` env var tells `run-swap.sh` where to look (default:
`<repo>/e2e/userdata/generated`).

**Token accounts (ERC-20):** `eth-usdt` uses USDT as the credit currency. Since USDT is an
ERC-20 token (currency id contains `/`), it is covered by the parent ETH account's `liveData`
scan — no separate Speculos call is made. Its address is copied from the ETH debit account.

---

## CLI fallback

The swap harness calls the `ledger-live-cli` binary to derive addresses. In a **git worktree**
where `apps/cli` hasn't been built, `run-swap.sh` automatically falls back to the **main repo's**
built CLI:

```bash
# Override manually:
LEDGER_LIVE_CLI_BIN=/path/to/main-repo/apps/cli/bin/index.js \
  bash e2e/mobile/maestro/run-swap.sh eth-usdt
```

---

## Why a harness?

Maestro is pure black-box UI automation; it cannot seed app state. The Detox suite seeds state over a
**websocket bridge** the app connects to at launch (reading the `wsPort` launch arg via
`react-native-launch-arguments`), and runs flows against **Speculos** (`MOCK=0`). The harness reuses
that exact infra but leaves the **app launch to Maestro** (`launchApp.arguments` deliver `wsPort`/`mock`
the same way Detox does). No app source changes.

---

## Debugging

```bash
# Inspect the live app UI tree (run while the app is open):
maestro hierarchy

# Maestro Studio (interactive flow builder):
maestro studio

# Harness logs (written per pair):
cat e2e/mobile/artifacts/harness-swap-<pair>.log

# Failure screenshot (written by Maestro on flow failure):
open ~/.maestro/tests/<latest>/screenshot-❌-*.png
# or: ls e2e/mobile/artifacts/maestro-debug/<pair>/
```

---

## Notes / known caveats

- **Launch-arg delivery is the key thing to validate first** — confirm Maestro's `arguments` reach
  `LaunchArguments.value()` on device. If not, the app defaults `wsPort` to `8099`, so a fixed port
  still works.
- **Metro must be stopped** before running swap tests. In iOS Debug mode `AppDelegate.swift` always
  connects to Metro on port 8081 if it's running, which overrides the embedded bundle and can serve
  a stale cached build.
- **iOS Debug bundle name**: `AppDelegate.swift` looks for `index.jsbundle` (not `main.jsbundle`).
  After a `FORCE_BUNDLING=1` build, copy: `cp main.jsbundle index.jsbundle` inside the built `.app`,
  then reinstall with `xcrun simctl install booted`.
- **Runner:** the harness is a plain **`ts-node` daemon** (`harness/main.ts`), not a jest test. It runs
  via `ts-node --swc --require tsconfig-paths/register` (see `start_harness` in `_platform.sh`), which
  gives it the `@swc` transform and resolves the `@shared/*`/`~/*` TS aliases + the `detox`->stub remap
  from `harness/tsconfig.json` (pinned to CommonJS so dynamic imports go through require). Mirrors the
  existing `e2e:loadConfig` ts-node bridge script. `harness/setup-globals.ts` recreates the handful of
  globals the reused infra expects outside a jest environment (`webSocket`, an `expect.getState()` shim).
- **Android:** same `appId` for debug (`com.ledger.live.debug`); the app reaches the bridge at
  `10.0.2.2:8099`. Release build → `com.ledger.live`.
- **`simctl`/`maestro`/`docker` commands require sandbox disabled** in Claude Code (`/sandbox` command
  or `dangerouslyDisableSandbox`); CoreSimulator returns "Operation not permitted" otherwise.

See [FINDINGS.md](./FINDINGS.md) for the feasibility verdict.
