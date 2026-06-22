# Maestro POC — ETH "Add Account"

A proof-of-concept evaluating **[Maestro](https://docs.maestro.dev)** as a replacement for Detox for
mobile E2E. It reproduces the Detox `addAccountETH.spec.ts` as Maestro YAML, reusing the existing
`e2e/mobile` backend (websocket bridge + Speculos) for state seeding.

## Layout (Nested Flows)

```
maestro/
├── config.yaml                 # workspace config (flows/ are the test cases)
├── flows/
│   └── add-account-eth.yaml    # the test = ordered runFlow of subflows
├── subflows/                   # reusable building blocks (Maestro "Nested Flows")
│   ├── launch-seeded.yaml      # launchApp with wsPort/mock launch args
│   ├── open-add-account.yaml   # portfolio → "Import with your Ledger"
│   ├── select-eth.yaml         # search + pick ETH (+ network if asked)
│   └── verify-eth-account.yaml # discovery → add → close → assert balance
├── harness/
│   ├── main.ts                 # reuses e2e/mobile bridge + Speculos seeding (plain ts-node daemon)
│   ├── setup-globals.ts        # recreates the few globals the reused infra reads (no jest env)
│   ├── detox-stub.ts           # `detox` stand-in (Maestro owns the device; does Android adb reverse)
│   └── tsconfig.json           # ts-node/tsconfig-paths config: aliases + detox->stub, no app launch
└── run-eth.sh                  # orchestrator: preflight → start backend → maestro test → teardown
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
