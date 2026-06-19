# Maestro vs Detox — POC findings (ETH add-account)

**Question:** can we replace Detox with [Maestro](https://docs.maestro.dev) for ledger-live-mobile E2E?
**Method:** reproduce the Detox `addAccountETH.spec.ts` as Maestro YAML, reusing the existing
`e2e/mobile` backend (bridge + Speculos). Worktree: `poc-maestro-2`.

## Verdict: PROVEN on iOS — the full ETH add-account passes end-to-end

The hard integration question ("can a black-box UI tool drive *our* app, which depends on a Detox
websocket bridge + Speculos?") is answered: **yes.** The complete ETH add-account flow — launch, skip
onboarding, search/select ETH, real Speculos account discovery, add, and balance assertion — runs green
under Maestro, reusing the existing bridge + Speculos backend, with **no app source changes**.

## What was validated in this session

| Check | Result |
| --- | --- |
| Latest Maestro installed | ✅ `maestro 2.6.0` (`/opt/homebrew/bin/maestro`) |
| Java runtime | ✅ uses Android Studio's bundled JDK 21 (`/Applications/Android Studio.app/Contents/jbr/Contents/Home`) — Maestro needs Java 17+ |
| Flow syntax (all 5 YAML files) | ✅ `maestro check-syntax` → `OK` for the main flow + every subflow |
| Nested-flow structure (`flows/` + `subflows/`, `runFlow`) | ✅ matches the docs' recommended layout; references resolve |
| testIDs | ✅ taken verbatim from `e2e/mobile/page/**` page objects (not guessed) |
| Backend reuse path | ✅ harness reuses `bridge/server.ts` (`init`/`loadConfig`/`setFeatureFlags`) and `InitializationManager.initialize` — the same entrypoint `app.init()` uses |
| **Live seed-only smoke test (iOS sim)** | ✅ **PASS** — see below |
| **Live FULL Speculos-backed ETH add-account (iOS sim)** | ✅ **PASS** — all 4 subflows green, real discovery + balance |

### Live seed-only smoke test — PASSED (iOS Simulator, iPhone 16 / iOS 18.6)

`MAESTRO_FULL=0 bash maestro/run-eth.sh` against a debug build proved the make-or-break parts:

```
Launch app "com.ledger.live.debug" ... (launch arguments: {wsPort=8099, mock=0, IS_TEST=true})... COMPLETED
[E2E Bridge Server]: Client connected          ← launch args reached the app via react-native-launch-arguments
[E2E Bridge Server]: Sending unsent messages   ← buffered seeding (acceptTerms/importSettings/navigate/flags) delivered + ACK'd
  Assert that id: add-account-cta is visible... COMPLETED   ← onboarding skipped, seeded portfolio
  Tap on id: add-account-cta / add-accounts-modal-add-button... COMPLETED
  Input text ETH / Assert id: asset-item-ETH is visible... COMPLETED   ← modular-drawer nav + testIDs work
```

This resolves the highest-risk unknown: **Maestro's `launchApp.arguments` reach the app the same way
Detox passes them**, and the existing bridge seeds state for a Maestro-launched app with no source changes.

Minor, non-blocking: a `Timeout while waiting for getFlags` is logged — the harness sends `getFlags`
before the app connects, so its ack window lapses; the flag overrides still flush + ACK on connect (the
modular drawer worked), and `getFlags` resolves to `""` on timeout. Harmless for the POC.

### Full Speculos-backed run — PASSED (iOS Simulator)

`SEED=... COINAPPS=... bash maestro/run-eth.sh` ran the complete `add-account-eth.yaml` green: Speculos
(Ethereum) booted in Docker, was registered with the app over the bridge, the app skipped onboarding,
Maestro searched/selected ETH, **Speculos derived the account ("Ethereum 1") — real discovery, not a
mock**, the account was added, and the asset page balance asserted. All four subflows COMPLETED.

What it took to run the full backend from a plain Jest process (all in `harness/`, no app changes):
- `harness/setup-globals.ts` — recreate the `webSocket` / `pendingCallbacks` / `jestExpect` globals the
  Detox `jest.environment.ts` normally installs.
- `harness/detox-stub.ts` (mapped via `moduleNameMapper`) — stub Detox's `device` (its `reverseTcpPort`
  needs a Detox worker and is a no-op on an iOS sim) and `log`.
- call `setupEnvironment()` in the harness — sets `E2E_NANO_APP_VERSION_PATH`, `DETOX=1`, `MOCK=""`, etc.
- env: `SEED` (test mnemonic) + `COINAPPS` (clone of LedgerHQ/coin-apps) — same as the Detox suite needs.
- `E2E_ENABLE_WALLET40=0` — the POC's flow/testIDs target the classic portfolio; Wallet 4.0 has a
  different layout (the `run-eth.sh` orchestrator sets this).

**Still to do:** the Android leg (intent-extra launch args + `adb reverse` for the bridge/Speculos
ports), and adapting the YAML to the Wallet 4.0 UI if that becomes the default under test.

## How it works

```
Maestro (YAML, UI only) ──launchApp(args: wsPort=8099, mock=0)──▶  ledger-live-mobile (.env.mock build)
                                                                          │ reads launch args via
                                                                          │ react-native-launch-arguments
                                                                          ▼
harness/backend.test.ts ──ws://:8099──▶ bridge (seed: skip-onboarding userdata + feature flags)
        │
        └── Speculos(Ethereum) in Docker ──DMK transport──▶ account discovery (address derivation)
```

- The Detox suite seeds state over a **websocket bridge** the app connects to at launch (it reads the
  `wsPort` launch arg via `react-native-launch-arguments`, gated by `Config.DETOX`). It runs with
  `MOCK=0` against **Speculos**, so device behaviour is a real emulator, not mid-flow mock events.
- Maestro's `launchApp.arguments` are delivered the **same way** Detox passes them, so the app connects
  to our harness's bridge. Crucially, **add-account needs no mid-flow bridge messages** — Speculos
  answers address derivation on its own. The bridge is only needed for **up-front** seeding.

## Effort vs Detox (qualitative)

| Aspect | Detox | Maestro |
| --- | --- | --- |
| Test authoring | TS page objects + Jest | declarative YAML; very low ceremony |
| Readability | medium | high (a junior can read/edit a flow) |
| App launch / device | Detox owns it | Maestro owns it (`launchApp`) |
| State seeding | bridge + Speculos (in-process) | **same bridge + Speculos**, via a small standalone harness |
| Cross-platform | iOS + Android configs | one YAML; `appId` is shared for debug (`com.ledger.live.debug`) |
| Selectors | `by.id`, regex helpers | `id:` (regex), text; `maestro studio` to inspect live |
| Flakiness knobs | custom waits | `extendedWaitUntil`, `retryOnFailure`, built-in waits |

The big win is **authoring simplicity**; the cost is **wiring the existing seeding infra to a process
Maestro doesn't own** (the harness), which this POC shows is small and requires no app changes.

## Risks / things to confirm on the first live run

1. **Launch-arg delivery — VALIDATED on iOS** (`Client connected` in the smoke run). Still to confirm on
   Android (intent extras). `client.ts` defaults `wsPort` to `8099`, so a fixed port works even if only
   `mock`/`IS_TEST` propagate.
2. **Harness runner — resolved during a first run attempt.** `tsx` cannot resolve the package's
   `@shared/*`/`~/*` TS aliases, so the harness now runs as a **jest test** (`harness/jest.config.js`,
   with all Detox bits stripped so it never launches the app). Running under jest also satisfies
   `expect.getState()` + the allure runtime used by the Speculos path. For a first smoke test use
   `MAESTRO_FULL=0` (bridge only). Note also: a fresh machine may have **no iOS simulator created** and
   **no mock app installed** — `run-eth.sh` now preflights both and fails fast with guidance.
3. **testID exactness.** A few selectors are dynamic/regex (`asset-item-ETH`, `account-item-*`). Confirm
   with `maestro studio` against the running app; adjust if the rendered id differs.
4. **Account select/continue interaction.** The flow asserts "Ethereum 1" then taps continue; if accounts
   aren't pre-selected, add an explicit `tapOn` on the account row before continue (see Detox
   `addAccountAtIndex`).
5. **Android debug build** may hit the known Detox/Espresso `eventInjector` bug — use the release build
   (`appId com.ledger.live`) if so.

## Recommended next steps

1. Live smoke test (`MAESTRO_FULL=0`): build iOS debug, boot a sim, start Metro, run
   `MAESTRO_FULL=0 bash maestro/run-eth.sh` → proves launch-arg delivery + bridge attach + onboarding
   skip + UI navigation up to discovery.
2. Full run (`bash maestro/run-eth.sh`) with Speculos → completes discovery and the balance assertion.
3. Repeat on Android.
4. If green: evaluate a second, more complex flow (e.g. a send) to test Maestro's limits before any
   migration decision.

---

# Swap (ETH → ETH-USDT) attempt — harder, partially blocked

Adapting `specs/swap/swapETH_ETH_USDT.spec.ts`. Artifacts: `harness/backend.test.ts` (MAESTRO_FLOW=swap),
`flows/open-swap.yaml`, `run-swap.sh`.

## What works
- **Swap backend harness initializes fully** (reusing the Detox swap setup, no app changes): builds the
  CLI (`pnpm build:cli`), boots Speculos with the **Exchange** app + Ethereum dependency, seeds the ETH +
  USDT accounts via **CLI live data** (`liveDataWithAddressCommand`), enables `ptxSwapLiveAppMobile`, runs
  `swapSetup()`, and starts `verifyAmountsAndAcceptSwap` in the background — logs `swap backend ready`.
- **Native navigation works on iOS**: Maestro sees native testIDs as `resource-id`
  (`portfolio-quick-action-button-swap`, `assetItem-Ethereum`, …); the seeded portfolio loads.

## Update with a FUNDED seed (run via the dev's interactive zsh, seed never logged)
With a real funded seed the harness seeds live balances correctly (portfolio shows ~$290: 117 USDT,
0.052 ETH, USDC, PYUSD, INJ). Confirmed along the way:
- **Maestro fully drives native iOS**: every element is exposed as `resource-id` + `accessibilityText`
  (`portfolio-quick-action-button-swap`, all `assetItem-*`, `topbar-settings`, …).
- **Staging swap backend is reachable** (`https://swap-stg.ledger-test.com/v5` → HTTP 200), so the
  WebView *can* load — network is not the issue.

## Navigation: SOLVED via Wallet 4.0 (the classic UI was the wrong version)
The swap test must run with **Wallet 4.0 enabled** (`E2E_ENABLE_WALLET40=1` + leaving `lwmWallet40` to
InitializationManager's default). The add-account POC had forced it *off* (classic UI), which was the
wrong version and is why earlier swap entries failed. With w40:
- The portfolio swap **quick-action** (`quick-action-swap` in w40; `portfolio-quick-action-button-swap`
  in classic) still **no-ops** under a Maestro tap.
- But w40 has a dedicated **Swap tab in the bottom nav, testID `w40-tab-swap`** — tapping it **navigates
  to the swap screen**, and the live-app WebView container (`wallet-api-webview`) mounts. ✅

## New blocker: the swap live app never finishes loading
After `w40-tab-swap`, the WebView shows a **loading spinner** (8s screenshot), and by ~50s the screen has
**reverted to Home**. So the swap live-app bundle (`ptxSwapLiveAppMobile` manifest `swap-live-app-stg-aws`)
isn't rendering on this machine. The swap **API** host is reachable (`swap-stg.ledger-test.com` → 200),
but the live-app **web bundle** (served separately) apparently isn't loading/rendering — likely a network
reachability difference for the staging live-app host (VPN/internal?), or a wallet-api/handshake gap.

- **WebView question — still unanswered:** Maestro sees the WebView *container* (`wallet-api-webview`) but
  the form never rendered, so we couldn't test whether it sees the form's text/`data-testid` internals.

## Next steps to try
- Confirm the staging swap **live-app bundle** is reachable/loadable from this machine (it may need VPN,
  unlike the API host); or try the **production** manifest (`PRODUCTION=true` → `swap-live-app-aws`).
- Pull the WebView console/load errors via the bridge `getLogs` (capped, no secrets) to see why the
  bundle stalls.
- Once the form renders, re-dump to finally answer whether Maestro can drive the live-app WebView (by
  text/coordinates), then write `swap-form.yaml`.
- Net: swap is **materially harder** than add-account — navigation is now solved (w40 + `w40-tab-swap`),
  but the live-app load + the WebView-driving question remain.

---

# Swap — first verdict (INCORRECT — superseded by the CORRECTION below)

> ⚠️ **This section's conclusion is wrong**, kept only as a record of the dead-end. I probed the *keypad*
> (a special case) and used the wrong selector text ("Choose asset"), then wrongly concluded Maestro
> can't click the WebView. The live-app **buttons** ARE tappable by text — see the **CORRECTION** at the
> bottom of this file, which is the authoritative verdict.

With the funded seed + Wallet 4.0, the whole pipeline works up to the live-app form:
1. **Backend** (Exchange Speculos + live-data seeding + swapSetup) — works.
2. **Navigation** — `w40-tab-swap` opens the swap screen; `wallet-api-webview` mounts.
3. **Live app renders** — the form loads (Send=ETH, Receive=Choose asset, balance, keypad, 25/50/75/Max,
   "v2.11.2-staging"). The earlier `127.0.0.1:8765` "Connection refused" is a **non-fatal** dev/analytics
   socket — the form renders regardless.
4. **Maestro READS the WebView** — the entire form surfaces as `accessibilityText` ("Send", "Receive",
   "Balance", "0.05235914 ETH", keypad `0-9 . Delete`, `25% 50% 75% Max`, "Select Currency or Token",
   "Switch inputs"). It does **NOT** surface the web `data-testid`s (only the native `wallet-api-webview`).

**The blocker — Maestro's taps do not register as clicks in the WebView DOM.** Decisive probe: with the
form loaded, `tapOn text "^5$"` on the keypad **COMPLETED** but the Send amount **stayed `0`** — a clean,
unambiguous tap on a single digit key had **zero effect**. Same for the Receive selector ("Choose asset"):
text-tap WARNED/FAILED on settle, coordinate-tap COMPLETED but opened nothing ("Select Currency or Token"
is just the selector's aria-label, present in every dump even while the screen shows "Choose asset" — the
picker never opened). So Maestro's synthetic taps land on the screen but the live app's React click
handlers never fire. Driving the form (currency select / amount / quotes / execute) is therefore not
possible by text or coordinate.

### Conclusion for the Maestro-vs-Detox evaluation
- **Native flows: excellent.** Add-account is fully green; Maestro sees every native testID as `resource-id`.
- **Live-app WebView flows (swap): not a reliable fit.** Maestro can reach and *read* the swap live app,
  but cannot dependably *drive* it: no `data-testid` exposure, and web-element taps (text or coordinate)
  don't reliably register clicks. Detox's `web.element(by.web.cssSelector('[data-testid=...]'))` (XCUITest
  web automation) is fundamentally more capable for this. A Maestro swap E2E would need either an
  accessibility-id shim injected into the live app (app/live-app change) or improved Maestro WebView
  click support — neither is a small lift.
- **Recommendation:** adopt Maestro for native flows; keep Detox (or wait for Maestro WebView
  improvements) for live-app-driven flows like swap/sell/card.

---

# CORRECTION — Maestro DOES drive the swap WebView (pure YAML)

The verdict above was **wrong**, found by studying the `feat/qaa-1242` POC. My failure was using the
wrong text ("Choose asset") and testing the keypad (a special case). The swap live-app buttons ARE
tappable by text. `flows/open-swap.yaml` now drives the whole swap in **100% YAML** (no flow-generation
TS; the only TS is the Speculos backend harness, unavoidable):

| Step | How (pure YAML) |
| --- | --- |
| Open swap | `tapOn id: w40-tab-swap` (native) |
| Wait for live app | `extendedWaitUntil visible text "Select Currency or Token"` |
| Select Receive = USDT | `tapOn text "Select Currency or Token" index 1` (WebView) → **native modular drawer** (`modular-drawer-search-input` → `inputText USDT` → `asset-item-USDT` → `account-item`) |
| Amount | `tapOn text "25%"` (WebView percentage button — the custom keypad is the one thing not tappable) |
| Quotes | `tapOn text "View quotes"` → `extendedWaitUntil "[0-9]+ quotes? found"` (8 real staging quotes) |
| Provider | cascade `tapOn text "1inch"/"Uniswap"/...` (expands the quote card) |
| Execute | `tapOn "Swap with <p>"` (inline) → `tapOn "Swap with <p>" index 1` (the Complete-steps button; title+button share the text) → **native tx Summary** |
| Confirm | `tapOn "Continue"` (native) → device |
| Sign | harness retries `verifyAmountsAndAcceptSwap` (amount matched as a substring, e.g. `0.013`) |

Proven across runs up to the native **Summary** + **Continue** + device hand-off.

**Caveat — flakiness.** WebView/live-network steps (the coin-selector tap, the modular-drawer search
results) are timing-flaky: different steps occasionally fail run-to-run even with `retryTapIfNoChange`
and generous `extendedWaitUntil`s. So swap is **drivable by Maestro in pure YAML**, but is **less stable
than native flows** and needs careful waits/retries.

### Corrected recommendation
Maestro CAN do live-app/WebView flows (swap) in pure YAML by driving visible **text** (+ the native
modular drawer + native tx steps). Native flows are rock-solid; WebView flows work but are flakier and
need robust waits. The amount field (custom keypad) is the one element not tap-drivable — use a
percentage button (or a bridge for an exact amount).

---

# P0 — swap device-signing root cause + fix (local Docker, iOS)

The swap UI drives green end-to-end, but the on-device signature fails: the app shows
**Step 2 of 3 "Connect device" → `GeneralDmkError`** and the harness signer logs
`connect ECONNREFUSED 127.0.0.1:<apiPort>`. Diagnosed this session (worktree `poc-maestro-2`),
reusing the `feat/qaa-1242-poc-maestro` branch as reference.

## Root cause (evidence-backed)
The app's DMK device-proxy and the harness's `verifyAmountsAndAcceptSwap` both reach Speculos at
`http://127.0.0.1:<SPECULOS_API_PORT>` (the host port Docker maps to the Exchange container's REST
API on container port **40000**; `DEVICE_PROXY_URL` is set to the same by `registerKnownSpeculos` →
`addKnownSpeculos`). That REST API is **intermittently unreachable at signing time**:

- `createSpeculosDevice` resolves "ready" ~500 ms after the emulator core starts, **before** the REST
  API binds; and `setupMainSpeculosApp` retries can recreate the Exchange container on a fresh port.
- When the registered port isn't actually accepting, both sides fail: app → `GeneralDmkError`,
  harness → persistent `ECONNREFUSED`.

Confirmed empirically:
- A **healthy** Speculos container answers `http://127.0.0.1:<port>/events` with **HTTP 200** on IPv4
  (so it's *not* a generic IPv4/IPv6 reachability problem — an early monitor artifact suggested that;
  a clean single-container probe disproved it).
- **Add-account** (ETH discovery) works reliably with the same local Docker Speculos on iOS — so the
  device-proxy path is fine generally; only the swap **signing** path hits the unreachable-port race.
- A run where the diagnostic showed `SPECULOS_API_PORT` reachable (HTTP 200) had a working device;
  the failing runs had the registered port refused from the first poll.

> Note: `feat/qaa-1242-poc-maestro` sidesteps this entirely on **iOS** by using **remote Speculos
> (Speculinho)** (`REMOTE_SPECULOS=true` + `SPECULINHO_URL`); it only uses local Docker on **Android**
> (with `adb reverse`). We chose to keep local Docker on iOS, so the fix targets that path.

## Fix (this session — flows stay 100% YAML; changes are harness/orchestrator only)
- **`harness/backend.test.ts`** — added `waitForSpeculosApiReady()`: after `swapSetup()` and before
  declaring "swap backend ready", poll the registered `SPECULOS_API_PORT` on `127.0.0.1` until the
  REST API answers (≤60 s), logging container state; warn loudly (with `docker ps`) if it never does.
  This guarantees the device step has a *live* device and turns the silent intermittent failure into
  an explicit, diagnosable one. (The signer already re-reads `SPECULOS_API_PORT` on every poll.)
- **`run-swap.sh`** — `cleanup()` now dumps `docker logs` of each Speculos container to
  `artifacts/speculos-<id>.log` before removing it (ground truth for "did the Exchange container
  crash / never bind its API port").

**Validated:** the gate logs `Speculos REST API reachable on 127.0.0.1:<port> (HTTP 200) — device
signing can proceed.` across runs.

## Not yet observed: a fully green signature
Couldn't confirm an end-to-end on-device signature this session because the run now fails **earlier**,
at the modular-drawer USDT step (the documented WebView flakiness). The live hierarchy at failure
shows the drawer auto-advanced to **"Select account"** offering only `add-new-account-button` (no
existing `account-item`) — i.e. no pre-selected USDT receive account, and the hard
`assertVisible asset-item-USDT` also races the single-match auto-advance. This is a **P1 drawer/
seeding** issue, independent of P0 device signing. (An earlier run *did* reach the device step and
failed there with exactly `GeneralDmkError` + `ECONNREFUSED`, which is what the gate addresses.)

## Next (P1) to get a green observed signature
1. Make the To-currency selection tolerant of the drawer auto-advance (don't hard-assert
   `asset-item-USDT`; handle the `Account-screen` with only `add-new-account-button`).
2. Decide USDT receive-account seeding: `qaa-1242` seeds only the **debit** (ETH) account and selects
   the ETH account as the USDT destination; poc-maestro-2 also seeds the USDT credit account but the
   drawer still shows no existing account — reconcile this.
