# Maestro Android CI debugging

A debugging playbook for running the **Maestro** suite (POC `feat/qaa-1242-poc-maestro`) on Android CI.

> Scope note: the POC currently runs a **single swap spec** on **one emulator** with **no sharding**
> (`.github/workflows/test-mobile-maestro-swap.yml`). The failure modes below are partly **observed**
> (documented Maestro behaviour + the POC's own README) and partly **anticipated** for a full suite,
> flagged accordingly. The iOS WebView blocker is tracked separately (see *Detox and Maestro -
> Comparison*).

## CI shape (POC)

* Runner: `reactivecircus/android-emulator-runner@v2`, single emulator (4 cores, 6 GB RAM).
* Maestro CLI installed at job start: `curl -Ls "https://get.maestro.mobile.dev" | bash`.
* Speculos: local (docker) on Android, as the Detox suite.
* Invocation: `cd e2e/maestro && maestro --version && pnpm maestro:android "<spec>"`.

## Anticipated / observed failure modes

### 1. WebView DOM not reachable — `androidWebViewHierarchy: devtools` *(observed-by-design)*

Android does not expose WebView content to the native a11y tree, so the runtime emits
`androidWebViewHierarchy: devtools` and Maestro reads the DOM over **Chrome DevTools**. This requires:

* the WebView to be **debuggable** (`WebView.setWebContentsDebuggingEnabled(true)` in the build), and
* DevTools to attach before the hierarchy snapshot.

If DevTools is not enabled or attaches late, `text:` matches against the swap live app **silently fail /
time out** with the element "not visible". Confirm via the captured hierarchy (see *Debugging tools*): if
the webview subtree is absent, this is the cause.

### 2. Interacting before the app/webview is ready *(anticipated — same root cause as WDIO)*

The WDIO Android investigation found the real root cause was **driving the app before it was ready**
(react-native-screens view-hierarchy crash, `CalledFromWrongThreadException` precursor). Maestro is
exposed to the **same app-level race** — it is framework-agnostic. The POC mitigates with:

* a bridge **`ready` handshake** awaited before the test body (`runtime/session.ts`), and
* `extendedWaitUntil` + `retryTapIfNoChange` instead of bare taps.

But the concurrent Speculos-accept (`Promise.allSettled([ctx.runFlow(...), acceptSwapOnDevice(...)])`) can
still race the device prompt. The README flags splitting the flow around signing if this proves unreliable.

> If you see the RN-screens `ScreenContentWrapper contains null child` crash, it is the **app**, not
> Maestro — update `react-native-screens` and avoid rapid navigation during setup (identical advice to
> the Detox/WDIO finding).

### 3. Maestro driver install on cold CI *(observed-by-design)*

The first `maestro test` of a job downloads/installs the Android automation driver. The POC adds
`--no-reinstall-driver` for every flow **after** the first to avoid repeated reinstalls:

```typescript
const driverArgs = this.flowCount > 0 ? ["--no-reinstall-driver"] : [];
```

Symptoms of a bad install: the very first flow hangs at driver startup or fails before any command runs.
Bump `MAESTRO_DRIVER_STARTUP_TIMEOUT` and check the Maestro CLI log.

### 4. Emulator resource / GPU pressure *(anticipated)*

Single emulator under load → slow hierarchy snapshots, especially with the DevTools DOM read on top.
Keep `disableAnimations`, ensure enough cores/RAM, and prefer `-gpu auto/swiftshader_indirect` on the
runner. The DevTools webview read is heavier than a native snapshot — expect longer per-step times on
swap.

### 5. Speculos readiness (remote) *(observed)*

The POC waits for Speculos (`waitForSpeculosReady`) when remote. A missing/slow Speculos surfaces as the
device-accept step timing out while the flow has already tapped *Execute*.

### 6. Log noise floods CI *(observed)*

The bridge traces every message; the Maestro runner sets `E2E_BRIDGE_QUIET=1` to suppress it. Without it,
stdout is dominated by per-message ACK tracing and real errors are hard to find.

## Debugging tools

* **`~/.maestro/tests/<run>/`** — Maestro writes a **screenshot + the view-hierarchy XML** on failure.
  This is the ground truth for *what Maestro could see*. The POC collects it as a CI artifact
  (`maestro-debug-android`) and attaches screenshots to Allure.
* **`maestro hierarchy`** / **`maestro studio`** — dump/inspect the live hierarchy; confirm whether the
  webview DOM is present and what labels exist.
* **`adb logcat`** — for app crashes (RN-screens, CameraX 0-cameras on emulator, etc.) — same noise
  catalogue as the WDIO Android page applies.
* **Maestro CLI log level** — raise verbosity to debug driver/devtools attach.

## Bottom line

| Priority | Issue | Blocks the run? |
| --- | --- | --- |
| **P0** | WebView DOM unreadable (`devtools` not attached / WebView not debuggable) | **Yes** — swap `text:` steps fail |
| **P1** | App not ready / RN-screens race during navigation (app bug, framework-agnostic) | **Yes** when it hits |
| **P2** | Maestro driver install/startup on cold CI | Intermittent first-flow hang |
| **P3** | Speculos readiness / accept timing | Swap signing step only |
| **P4** | Emulator GPU/resource pressure, log noise | Slowness / debuggability |

The actionable Maestro-specific risks are **#1 (devtools webview)** and **#3 (driver install)**; the
**app-readiness race (#2)** is the same class of issue the WDIO investigation hit and is not solved by the
runner choice. If the full Android suite hangs the way WDIO did, the question is again whether we can
synchronise reliably with Ledger Wallet app states — Maestro's lack of app-state sync makes that **our**
responsibility via waits and the bridge handshake.

