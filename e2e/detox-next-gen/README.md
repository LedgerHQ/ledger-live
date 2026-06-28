# E2E Tests — Detox Next Gen

Experimental Detox suite for **Ledger Wallet Mobile**, sitting alongside
[`e2e/mobile`](../mobile/). A **page-object** suite built on a small, typed
element-interaction lib, so specs read top-to-bottom as `app.*`.

It is **not** a replacement for `e2e/mobile` yet — treat it as a sandbox.

## Conventions — read before changing tests

| Doc | When to read |
|---|---|
| [docs/elements.md](docs/elements.md) | Using or extending the element lib (`helpers/elements`) |
| [docs/page-objects.md](docs/page-objects.md) | Adding or changing a page object (`pages/`) |
| [docs/specs.md](docs/specs.md) | Writing or changing a spec (`specs/`) |
| [docs/timeouts.md](docs/timeouts.md) | Choosing a wait timeout |
| [docs/debugging.md](docs/debugging.md) | Investigating a failure — artifacts captured on failure & where |

## Layout

| Path | What |
|---|---|
| `specs/<feature>/*.test.ts` | Specs — drive the app via `app.*` only; one scenario per file |
| `flows/<feature>/` | Reusable flows + setup + parameterized runners (`*.runner.ts`) |
| `pages/` | Page objects + the `app` aggregator |
| `helpers/elements/` | Element-interaction lib (`native/` + `web/`) |
| `helpers/timeouts.ts` | Speed-tier wait durations |
| `helpers/` | Redux bridge + launch / config / Speculos setup |
| `userdata/` | Redux state fixtures |

Two data paths feed a spec: the **bridge** (test JS ↔ in-app JS over WebSocket, to seed
state without driving onboarding) and **Detox** (taps/reads on the native UI). Speculos
(the device emulator) is driven separately via `@ledgerhq/live-common/e2e/speculos` plus
its HTTP button API — see [docs/specs.md](docs/specs.md).

## Quick start

### Prerequisites

Same shape as [`e2e/mobile`](../mobile/README.md): macOS + Xcode ≥ 16.2 (iOS sim named
`iOS Simulator`), Android Studio (emulator `Android_Emulator`), Docker with the Speculos
image (`docker pull ghcr.io/ledgerhq/speculos:latest`), and `mise install` from the repo root.

### Environment

| Var | What | Required by |
|---|---|---|
| `SEED` | 24-word seed Speculos boots with | Speculos specs |
| `COINAPPS` | Path to local coin-apps (`Bitcoin.elf`, …) | local Speculos |
| `REMOTE_SPECULOS` | `true` to use Speculinho instead of Docker | remote Speculos |
| `SPECULINHO_URL` | Speculinho service URL | when `REMOTE_SPECULOS=true` |
| `SPECULOS_DEVICE` | Device model — `LNSP` (default), `LNS`, `LNX`, `STAX`, `FLEX`, `NanoGen5` | optional |
| `ANDROID_HOME` | Android SDK path | Android specs |

Speculos specs **require** `SEED` + (`COINAPPS` or `REMOTE_SPECULOS`): they boot a real
Speculos in `beforeAll`, so without it they fail rather than skip. Run them with the env set
(or target the non-device specs, e.g. `specs/smoke/starter.test.ts`).

### Build & run

```bash
# build the shared live-mobile binary (Release, as CI uses)
pnpm --filter live-mobile run e2e:build --configuration ios.sim.release   # or android.emu.release

# run the suite
pnpm --filter detox-next-gen test:ios                                      # or test:android

# single spec
cd e2e/detox-next-gen && pnpm exec detox test --configuration ios.sim.release specs/receive/receive.test.ts
```

## Userdata

| File | State |
|---|---|
| `skip-onboarding` | Onboarded, no accounts, legacy nav |
| `skip-onboarding-w40` | Onboarded, no accounts, Wallet 4.0 + Modular Drawer |
| `device-ready` | Onboarded, BTC + ETH (+ USDT) + POL seeded, Wallet 4.0 + Modular Drawer + Swap |

Need a different state? Add a new `userdata/*.json` rather than mutating an existing one —
other specs depend on the current shapes.

## Gotchas (setup / run)

- **Reuses the installed binary.** `behavior.init.reinstallApp: false` reuses whatever `.app` is on the sim. After rebuilding, re-install or you keep testing the old binary: `xcrun simctl install <udid> <path-to-.app>`. The "Config.DETOX not set" failure is usually this.
- **Pin Jest to 29.** `@jest/reporters@30` + `jest@29` throw `Cannot read properties of undefined (reading 'isSet')`; keep all `jest*` / `@jest/*` on the same major (`package.json` pins 29.x).
- **Detox 20.51 jest reporter** crashes on exit with the same `isSet` error — `jest.config.js` already opts out.
- **Pre-ldls `AssetItem` testID** doesn't propagate (styled `Pressable` on iOS); match by text where it bites.

## Status

- ✅ Element lib + page-object model; all specs driven via `app.*`
- ✅ Receive verify-on-device end-to-end; Speculos lifecycle
- 🚧 Swap (DEX + CEX) — reaches the device-sign step; depends on the current swap-live-app build
- ⏳ Send, Buy/Sell next
