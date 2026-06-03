# E2E Tests - Mobile (Maestro POC)

A **proof of concept** for running the **Ledger Wallet Mobile** end-to-end (E2E) tests with
[Maestro](https://maestro.mobile.dev/) instead of Detox.

It is **not** raw Maestro `.yaml` flows. It's a small TypeScript layer on top of the Maestro CLI:
specs are written in TypeScript, use Page Objects, and reuse the existing mobile E2E **WebSocket
bridge** + **Speculos** infrastructure that the Detox suite already relies on.

> Status: POC. Only two specs exist (`addAccount`, `swapEthUsdt`) and several production-readiness
> pieces are intentionally missing — see [Known limitations](#known-limitations). For the production
> Detox suite, see [../mobile/README.md](../mobile/README.md).

---

## How it works

A run is started by [scripts/run.ts](scripts/run.ts) with a `--project` (which build/platform) and an
optional spec name (omit it to run every spec). Each spec runs inside
[`withMaestroSession`](runtime/session.ts), which owns the full lifecycle: install the app, start
Speculos, start the bridge, launch the app and wait for `ready`, run the test body, then tear
everything down.

The test body doesn't run Maestro step-by-step. Page Objects **build**: each call appends commands to
a shared [`FlowBuilder`](runtime/flowBuilder.ts). The spec then calls `ctx.runFlow(name)` once, which
serializes the whole buffer into a single `.yaml` and runs one `maestro test`
([runtime/maestro.ts](runtime/maestro.ts)).

Native UI is always Maestro commands in that one flow, located by `id` / `text` (eg
`{ tapOn: { id } }`). The **live-app WebView** is driven the same way on both platforms: Maestro matches
its elements by their **visible label** (`text:`, `pages/swapLiveApp.ts`), and everything stays inside
the single flow. (`data-testid`s are not used — the live app does not expose them as `id`.)

- **iOS (≤ 18.x)** — the WKWebView projects its content into the accessibility tree Maestro reads, so
  `text:` matches directly. Verified end-to-end on an iPhone 16 Pro / iOS 18.6.
- **Android** — WebView content is **not** exposed to the native accessibility APIs, so the runtime adds
  `androidWebViewHierarchy: devtools` automatically; Maestro then reads the DOM via Chrome DevTools and
  `text:` matches the DOM text.

> **iOS 26 is not supported.** Apple stopped exposing WebView content to the accessibility tree Maestro
> reads ([Maestro #2891](https://github.com/mobile-dev-inc/Maestro/issues/2891)), so `text:` no longer
> reaches the swap WebView there, and there is no fallback.

The **bridge** ([../mobile/bridge/server.ts](../mobile/bridge/server.ts), the same one the Detox suite
uses) is used only for non-UI bootstrap: userdata, feature flags, and registering Speculos. **Speculos
device signing** runs in TS, concurrently with the single flow (the device only receives the tx once the
flow taps Execute). Everything is wired together in [context.ts](context.ts) (the composition root), and
each run writes Allure results via [runtime/allure.ts](runtime/allure.ts).

### Folder layout

| Path        | Purpose                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/`  | CLI entry point (`run.ts`) and standalone `typecheck.js`.                                                                                          |
| `runtime/`  | Core glue: Maestro driver, flow builder, bridge, session, CLI runner, Allure reporter.                                                             |
| `pages/`    | Page Objects (`app`, `portfolio`, `modularDrawer`, `swap`, and the swap WebView page object `swapLiveApp`, matched by `text:` on both platforms). |
| `specs/`    | The tests, registered in `specs/index.ts`.                                                                                                         |
| `config/`   | Project definitions (platform, appId, app path).                                                                                                   |
| `devices/`  | Speculos device manager.                                                                                                                           |
| `utils/`    | Spec helpers (e.g. `swapUtils`).                                                                                                                   |
| `userdata/` | Importable app state fixtures (e.g. `skip-onboarding.json`).                                                                                       |
| `types/`    | Ambient TypeScript declarations.                                                                                                                   |

---

## Quick Start

### 1. Prerequisites

This POC reuses the Detox E2E environment (Speculos, simulators/emulators, toolchain). Set that up
first by following [../mobile/README.md](../mobile/README.md), then add Maestro:

- macOS (required for iOS), Xcode, Android Studio + an emulator.
- Docker Desktop running, with the Speculos image pulled:

```bash
docker pull ghcr.io/ledgerhq/speculos:latest
```

- Install the **Maestro CLI** (must be on your `PATH`):

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
maestro --version   # sanity check
```

### 2. Environment variables

Same Speculos variables as the Detox suite (the runner sets the E2E bridge vars automatically):

```bash
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
export SPECULOS_DEVICE="nanoX"          # nanoSP | nanoX | nanoS | stax | flex | nanoGen5
```

### 3. Build the app

Maestro installs the same builds Detox uses. Build from the **repo root** (`ledger-live/`):

```bash
# iOS release  -> project "ios"        (no Metro)
pnpm mobile e2e:build -c ios.sim.release

# Android      -> project "android"    (no Metro)
pnpm mobile e2e:build -c android.emu.release
```

Debug projects (`ios.debug`, `android.debug`) use the debug builds and need Metro running in another
terminal: `pnpm mobile start`.

### 4. Run tests

From the **`e2e/maestro/`** directory. Append a spec name to run just that test, or omit it to run
**every** spec:

```bash
pnpm maestro:ios                  # run ALL specs on iOS (release)
pnpm maestro:ios swapEthUsdt      # run only swapEthUsdt on iOS
pnpm maestro:android              # run ALL specs on Android (release)
pnpm maestro:ios:debug            # all specs on iOS (debug, needs Metro)
```

- Valid projects: see [config/projects.ts](config/projects.ts).
- Valid specs: see [specs/index.ts](specs/index.ts).

### 5. Reports (Allure)

Every run writes Allure results to `allure-results/`:

```bash
pnpm allure   # generate + open the report
```

### 6. Lint & typecheck

```bash
pnpm lint        # oxlint
pnpm typecheck   # tsc via scripts/typecheck.js
```

---

## Adding a spec

1. Create `specs/<name>.ts` exporting an `async (ctx: MaestroContext) => Promise<void>` runner that
   wraps its body in [`withMaestroSession`](runtime/session.ts).
2. Register it in [specs/index.ts](specs/index.ts) so the spec name resolves.
3. Reuse the existing Page Objects in `pages/`, or add a new one and expose it on
   [context.ts](context.ts).
4. Run it with `pnpm maestro:<project> <name>`.

---

## Known limitations

This is a POC; judged as a Detox replacement it is still early. Notable gaps:

- **No test framework** — specs are plain async functions that `throw`; no assertion library, no
  `describe`/`it`.
- **No suite tooling** — no tagging, filtering, sharding, or parallelism.
- **No CI integration** — no workflow, no JUnit output, and no screenshot/video on failure.
- **Hand-rolled YAML** — flows are serialized with a small custom serializer, not a YAML library.
- **Still rides the `DETOX` flag** — `DETOX=1` is set as a legacy alias because shared libs still
  gate on it.
- **Temp flow files** — generated `.yaml` flows under `artifacts/maestro/tmp` are not cleaned up.
- **WebView automation is iOS ≤ 18.x + Android only** — the swap WebView is matched by `text:` on both
  platforms (`pages/swapLiveApp.ts`): iOS exposes WebView content to the accessibility tree natively,
  while Android needs `androidWebViewHierarchy: devtools` (added automatically) to read the DOM via
  Chrome DevTools. **iOS 26 is unsupported**: Apple no longer exposes WebView content to that tree
  ([Maestro #2891](https://github.com/mobile-dev-inc/Maestro/issues/2891)) and there is no fallback.
- **Swap/Speculos timing** — the single flow runs concurrently with the device-accept step; if the
  device prompt timing proves unreliable, split the swap into two runs around signing (see
  `executeSwapAndAccept` in `utils/swapUtils.ts`).
