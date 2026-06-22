# Maestro POC — ledger-live-mobile E2E

A proof-of-concept evaluating **[Maestro](https://docs.maestro.dev)** as a replacement for Detox for
mobile E2E, reusing the existing `e2e/mobile` backend (websocket bridge + Speculos) for state seeding.
It ports three Detox specs to Maestro YAML: ETH add-account, send DOGE, and ETH→USDT swap.

## Layout (Nested Flows)

```
maestro/
├── config.yaml                     # workspace config (flows/ are the test cases)
├── flows/                          # test cases — each is an ordered runFlow of subflows
│   ├── add-account-eth.yaml
│   ├── send-doge.yaml
│   ├── swap-eth-usdt.yaml
│   └── smoke-launch.yaml           # seed-only smoke (no Speculos)
├── subflows/                       # reusable, parameterized building blocks (Nested Flows)
│   ├── launch.yaml                 # launchApp with the seed launch args
│   ├── dismiss-analytics-prompt.yaml
│   ├── open-add-account.yaml
│   ├── modular-drawer-pick.yaml    # env SEARCH/ASSET_ID/NETWORK_ID/NETWORK_REQUIRED/PICK_ACCOUNT
│   ├── add-discovered-account.yaml # env ACCOUNT_NAME
│   ├── open-asset-assert-balance.yaml  # env ASSET_ID/TITLE_ID
│   ├── enter-recipient.yaml        # env RECIPIENT
│   ├── enter-amount.yaml           # env AMOUNT
│   ├── choose-fee-and-continue.yaml    # env FEE
│   └── await-ondevice-success.yaml # env SUCCESS_ID
├── scripts/                        # onFlowStart JS hooks (backend reachability, fetch send params)
├── harness/                        # reuses e2e/mobile bridge + Speculos seeding (plain ts-node daemon)
└── run.sh, run-eth.sh, run-send-doge.sh, run-swap.sh, _platform.sh   # orchestrators
```

## Why a harness?

Maestro is pure black-box UI automation; it cannot seed app state. The Detox suite seeds state over a
**websocket bridge** the app connects to at launch (reading the `wsPort` launch arg via
`react-native-launch-arguments`), and runs flows against **Speculos** (`MOCK=0`). The harness reuses
that exact infra but leaves the **app launch to Maestro** (`launchApp.arguments` deliver `wsPort`/`mock`
the same way Detox does). No app source changes.

## Run

```bash
# from repo root, once: build the mock app + pull Speculos
pnpm e2e:mobile build:ios:debug            # appId: com.ledger.live.debug
docker pull ghcr.io/ledgerhq/speculos:latest
pnpm mobile start                          # iOS debug needs Metro (separate terminal)

# boot a simulator (Maestro needs a running device):
maestro start-device --platform ios     # or open Simulator.app and boot an iPhone

# then:
bash e2e/mobile/maestro/run-eth.sh                 # full, Speculos-backed
MAESTRO_FULL=0 bash e2e/mobile/maestro/run-eth.sh  # seed-only smoke test (no Speculos)
```

`run-eth.sh` preflights the prerequisites (Java, maestro, a booted sim, the installed app, Docker) and
fails fast with guidance if anything is missing.

Use `maestro studio` against the running app to confirm any testID that doesn't match.

## Notes / known caveats

- **Launch-arg delivery is the key thing to validate first** — confirm Maestro's `arguments` reach
  `LaunchArguments.value()` on device. If not, the app defaults `wsPort` to `8099`, so a fixed port
  still works.
- **Runner:** the harness is a plain **`ts-node` daemon** (`harness/main.ts`), not a jest test. It runs
  via `ts-node --swc --require tsconfig-paths/register` (see `start_harness` in `_platform.sh`), which
  gives it the `@swc` transform and resolves the `@shared/*`/`~/*` TS aliases + the `detox`->stub remap
  from `harness/tsconfig.json` (pinned to CommonJS so dynamic imports go through require). Mirrors the
  existing `e2e:loadConfig` ts-node bridge script. `harness/setup-globals.ts` recreates the handful of
  globals the reused infra expects outside a jest environment (`webSocket`, an `expect.getState()` shim).
- **Android:** same `appId` for debug (`com.ledger.live.debug`); the app reaches the bridge at
  `10.0.2.2:8099`. Release build → `com.ledger.live`.

See [FINDINGS.md](./FINDINGS.md) for the feasibility verdict.
