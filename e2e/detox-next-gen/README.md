# E2E Tests — Detox Next Gen

Experimental Detox suite for **Ledger Wallet Mobile**, sitting alongside
[`e2e/mobile`](../mobile/) so the two can run side-by-side. The goal is
to find out how minimal we can get — no page objects, a thin Redux-bridge
helper, Speculos wired through `@ledgerhq/live-common`, specs that read
top-to-bottom.

It is **not** a replacement for `e2e/mobile` yet. Treat it as a sandbox.

---

## Quick Start

### 1. Prerequisites

Same shape as [`e2e/mobile/README.md`](../mobile/README.md) — anything
that builds & runs the mobile app on iOS/Android works here too:

- **macOS** (required for iOS)
- **Xcode** ≥ 16.2 with an iOS simulator named `iOS Simulator`
- **Android Studio** with an emulator named `Android_Emulator`
- **Docker Desktop** running, with the Speculos image pulled:

  ```bash
  docker pull ghcr.io/ledgerhq/speculos:latest
  ```

- **`mise install`** from the repo root for the pinned toolchain.

### 2. Environment variables

| Var | What | Required by |
|---|---|---|
| `SEED` | 24-word seed phrase Speculos boots with | Speculos-based specs |
| `COINAPPS` | Path to the local coin-apps directory (Bitcoin.elf, Ethereum.elf, …) | local Speculos |
| `REMOTE_SPECULOS` | `true` to use Speculinho instead of local Docker | remote Speculos |
| `SPECULINHO_URL` | URL of the Speculinho service | when `REMOTE_SPECULOS=true` |
| `SPECULOS_DEVICE` | Device model — `LNSP` (default), `LNS`, `LNX`, `STAX`, `FLEX`, `NanoGen5` | optional |
| `ANDROID_HOME` | Path to the Android SDK | Android specs |

Specs that depend on Speculos auto-skip when `SEED` is missing.

### 3. Build the app

The package shares the live-mobile build output — point your detox build
at the `Release` configuration (matches what CI uses):

```bash
pnpm --filter live-mobile run e2e:build --configuration ios.sim.release
# or for Android:
pnpm --filter live-mobile run e2e:build --configuration android.emu.release
```

### 4. Run the suite

```bash
pnpm --filter detox-next-gen test:ios
pnpm --filter detox-next-gen test:android
```

Single spec:

```bash
cd e2e/detox-next-gen
pnpm exec detox test --configuration ios.sim.release e2e/receive.test.ts
```

---

## What's in the box

### Specs

| Spec | What it exercises |
|---|---|
| [`e2e/starter.test.ts`](e2e/starter.test.ts) | Boots into a seeded wallet via the bridge. Smoke test for `launchApp` + `loadConfig` + `navigate`. |
| [`e2e/speculos.test.ts`](e2e/speculos.test.ts) | Launches a Bitcoin Speculos and verifies the app stays on the wallet root once it's wired in via `addKnownSpeculos`. |
| [`e2e/receive.test.ts`](e2e/receive.test.ts) | End-to-end Receive flow (Wallet 4.0) with **verify-on-device**. Drives Speculos through Address → Confirm using `expectValidAddressDevice` from `@ledgerhq/live-common/e2e/speculos`. |
| [`e2e/swap.test.ts`](e2e/swap.test.ts) | ETH → ETH-USDT swap scaffolding — mirrors `e2e/mobile/specs/swap/swapETH_ETH_USDT.spec.ts`. Currently runs through the Swap Live App webview to Execute; the device-sign step needs more work on the current swap-live-app build. |

### Helpers

| File | What |
|---|---|
| [`bridge/server.ts`](bridge/server.ts) | WebSocket server the in-app `e2e/bridge/client.ts` dials. Sends typed messages: `acceptTerms`, `importSettings`, `importAccounts`, `navigate`, `overrideFeatureFlag`, `addKnownSpeculos`, `removeKnownSpeculos`, `swapSetup`. |
| [`helpers/launchApp.ts`](helpers/launchApp.ts) | Boots the app + opens the bridge socket. Passes `wsPort` via `launchArgs`. |
| [`helpers/loadConfig.ts`](helpers/loadConfig.ts) | Reads a `userdata/*.json` and streams it through the bridge. Order matters: `acceptTerms → importSettings → featureFlags → navigate → importAccounts`. |
| [`helpers/speculos.ts`](helpers/speculos.ts) | `launchSpeculos(appName)` / `shutdownSpeculos(handle)`. Wraps `startSpeculos` + `device.reverseTcpPort` + `bridge.addKnownSpeculos` + sets `SPECULOS_API_PORT` so live-common helpers find the running instance. |
| [`helpers/setupDeviceReady.ts`](helpers/setupDeviceReady.ts) | One-call boot into the seeded-wallet-with-device state: `launchApp` + `loadConfig("device-ready")` + `launchSpeculos`. |

### Userdata

| File | Contents |
|---|---|
| [`userdata/skip-onboarding.json`](userdata/skip-onboarding.json) | Onboarding done, no accounts, no feature flags. Legacy wallet UI. |
| [`userdata/skip-onboarding-w40.json`](userdata/skip-onboarding-w40.json) | Onboarding done, no accounts, `lwmWallet40` + `llmModularDrawer` enabled. |
| [`userdata/device-ready.json`](userdata/device-ready.json) | Onboarding done, BTC + ETH (with USDT subaccount) + POL accounts seeded with addresses that match the standard e2e SEED, Wallet 4.0 + Modular Drawer + Swap Live App flags on. |

---

## Architecture in 60 seconds

```
     Jest test                                    iOS / Android simulator
  ┌───────────────┐                              ┌────────────────────────┐
  │ receive.test  │  WebSocket (helpers/launchApp + bridge/server.ts)
  │   .ts         │ ◄───────────────────────────►│  ledger-live-mobile    │
  │               │  acceptTerms / importSettings│   (Debug or Release)   │
  │               │   navigate / addKnownSpeculos│                        │
  └───────┬───────┘                              │                        │
          │ Detox UI driving                     │                        │
          │ device.launchApp, element(...).tap   │                        │
          ▼                                      │                        │
  ┌───────────────┐                              │                        │
  │ Detox runtime │ ────► native UI testIDs ────►│ Wallet 4.0 / drawers   │
  └───────┬───────┘                              │                        │
          │                                      │                        │
          │ Speculos drive                       │                        │
          │ via @ledgerhq/live-common/e2e/speculos                        │
          ▼                                      │                        │
  ┌───────────────┐    HTTP (button presses,     │  DMK transport ────────┘
  │   Speculos    │◄── screen reads via the      │     │
  │    Docker     │    speculos-device-controller│     ▼   APDU
  │  (Bitcoin /   │◄─────────────────────────────│  127.0.0.1:port/apdu
  │   Exchange)   │                              │
  └───────────────┘
```

Two distinct data paths:

1. **Bridge**: test JS ↔ in-app JS via WebSocket. Used to seed state
   without driving onboarding UI (`importAccounts`, feature flags, etc.).
2. **Detox**: test → native simulator → app native module. Used to tap
   testIDs, read text, take screenshots.

Plus Speculos: the app sends APDUs to the Speculos Docker container;
the test side drives Speculos via its HTTP API (button presses, screen
reads) using `@ledgerhq/live-common/e2e/speculos`.

---

## Gotchas worth knowing about

These bit us during development — saving you the re-discovery.

### Detox sync deadlocks against Speculos

When the app sends an APDU that requires a button press on the device
(verify address, sign transaction, account discovery's `get_address`
with `verify=true`), the request stays pending on `127.0.0.1:port/apdu`
until the user (or Speculos automation) presses the button. Detox's
default "wait for app idle" model sees the network request and waits
forever.

**Fix**: `await device.disableSynchronization()` immediately *after*
the tap that starts the APDU stream — see `receive.test.ts` step 3
(after `add-new-account-button`). Re-enable with
`device.enableSynchronization()` only after the device-driven section
completes. Native `waitFor(...).toBeVisible()` still works with sync
off because it polls the UI directly.

### Webview testIDs

The Swap Live App is a React (not RN) webview. React sets `data-testid`
on the rendered DOM, but Detox's `by.web.id` matches HTML `id=`. Use
the `webByTestId` helper in `swap.test.ts` — it's a one-liner that goes
via `by.web.cssSelector('[data-testid="..."]')`.

Detox web has no `waitFor` either; use the `pollWeb` helper for
toExist-style polling.

### Jest 30 vs Jest 29

`@jest/reporters@30.x` and `jest@29.x` together throw
`TypeError: Cannot read properties of undefined (reading 'isSet')` on
otherwise-passing runs, because Jest 30 expects `testPathPatterns` to
be a `TestPathPatterns` class instance. Keep all `jest*` /
`@jest/*` packages on the same major. Our `package.json` pins 29.x
explicitly so the workspace catalog's `30.x` doesn't leak in.

### Pre-ldls `AssetItem` testID doesn't propagate

`libs/ui/packages/native/src/pre-ldls/components/AssetItem/AssetItem.tsx`
sets a testID on a `styled(Pressable)` wrapper. styled-components +
RN's combo swallows it on iOS. Specs work around this with `by.text(...)`.

### Detox 20.51 + Jest reporter crash on exit

`detox/runners/jest/reporter` throws
`TypeError: Cannot read properties of undefined (reading 'isSet')` in
the secondary context on test completion. Our `jest.config.js` already
opts out — `reporters: ['detox/runners/jest/reporter']` is replaced
with the default reporter only.

### Live build / install drift

Detox `behavior.init.reinstallApp: false` (our default) reuses whatever
binary is currently installed on the simulator. If you rebuild the app
without `xcrun simctl install <udid> <path-to-.app>`, your test keeps
hitting the **old** binary. The "Config.DETOX not set" failure mode is
almost always this — a build made without `ENVFILE=.env.mock` lurking
on the sim. Re-install:

```bash
xcrun simctl install <SIM_UDID> \
  apps/ledger-live-mobile/ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app
```

---

## Adding a new spec

Pick the right userdata for the state you want the app in:

- **Onboarded, empty wallet, legacy nav** → `skip-onboarding`
- **Onboarded, empty wallet, Wallet 4.0** → `skip-onboarding-w40`
- **Onboarded, BTC + ETH + USDT + POL seeded, W4 + Modular Drawer + Swap** → `device-ready`

Then in `beforeAll`:

```ts
await launchApp();
await loadConfig("device-ready");
const handle = await launchSpeculos("Bitcoin");  // omit if no device needed
```

If you need a *different* state, add a new `userdata/*.json` rather
than mutating an existing one — other specs depend on the current
shape.

---

## Status

- ✅ Starter / seeded-wallet smoke
- ✅ Speculos lifecycle
- ✅ Receive verify-on-device end-to-end
- 🚧 Swap (Exchange Speculos + Swap Live App webview) — navigation lands
  on the Execute button; device-sign step needs swap-live-app testID
  refresh
- ⏳ Send flow (next obvious milestone)
- ⏳ Buy/Sell (another webview-driven flow)
