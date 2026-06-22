/**
 * Maestro backend harness (runs as a Jest test so the package's alias resolution,
 * @swc transform, expect.getState() and allure runtime are all available).
 *
 * It reuses the EXISTING e2e/mobile infra to seed the app, but does NOT launch the
 * app — Maestro does that and points it at this bridge (../subflows/launch-seeded.yaml).
 * The single test seeds state then blocks forever; the orchestrator (../run-eth.sh)
 * kills the process once Maestro finishes.
 *
 * Env:
 *   MAESTRO_FLOW  "add-account" (default) or "swap".
 *   MAESTRO_BRIDGE_PORT  default 8099 — MUST match `wsPort` in launch-seeded.yaml
 *   MAESTRO_FULL  (add-account only) "1" (default) = Speculos(Ethereum) discovery; "0" = seed-only.
 *   SWAP_AMOUNT   (swap only) ETH amount to swap; default "0.01".
 *
 * Run via: pnpm exec jest --config maestro/harness/jest.config.js --runInBand
 */
import { init as initBridge, loadConfig, setFeatureFlags } from "../../bridge/server";
import fs from "fs";
import path from "path";
import http from "http";

const FLOW = process.env.MAESTRO_FLOW ?? "add-account";
const PORT = Number(process.env.MAESTRO_BRIDGE_PORT ?? 8099);
// Tiny HTTP control endpoint the Maestro flows talk to directly (onFlowStart hooks + JS http.get),
// so a flow can coordinate with this backend itself instead of relying on bash to pass values via
// `-e` / temp files. Maestro's JS sandbox runs on the HOST, so localhost reaches this process.
const CONTROL_PORT = Number(process.env.MAESTRO_CONTROL_PORT ?? 8100);
const FULL = process.env.MAESTRO_FULL !== "0";
const USERDATA = "skip-onboarding";
// The orchestrator waits for this file before launching the app, so all seed
// messages are buffered and flushed to the app at connect time (i.e. onboarding is
// skipped at startup). Without this, full-mode seeds arrive after Speculos boots —
// too late, the app is already on the onboarding screen.
const READY_FILE = path.resolve("artifacts", ".maestro-harness-ready");

// Mirrors the modular-drawer defaults InitializationManager sets, so the add-account
// UI path the YAML drives is enabled in seed-only mode too.
const SEED_FLAGS = {
  llmModularDrawer: {
    enabled: true,
    params: {
      add_account: true,
      receive_flow: true,
      send_flow: false,
      live_app: true,
      enableModularization: true,
      searchDebounceTime: 300,
      backendEnvironment: "PROD",
      live_apps_allowlist: [],
      live_apps_blocklist: ["revoke-cash"],
    },
  },
  onboardingWidget: { enabled: true },
} as const;

const NO_ANALYTICS_PROMPT = { llmAnalyticsOptInPrompt: { enabled: false } } as const;

// Mutable state served over the control HTTP endpoint. Updated as the backend reaches readiness /
// derives values (e.g. the send-doge recipient), so flows can fetch them with `http.get`.
const control: { ready: boolean; recipient?: string; amount?: string; flow: string } = {
  ready: false,
  flow: FLOW,
};

function startControlServer(port: number): void {
  const server = http.createServer((req, res) => {
    const url = (req.url ?? "/").split("?")[0];
    const send = (status: number, body: string) => {
      res.writeHead(status, { "content-type": "text/plain", "cache-control": "no-store" });
      res.end(body);
    };
    switch (url) {
      case "/ready":
        // 200 once seeding is buffered + (full mode) Speculos is up; 503 until then.
        return control.ready ? send(200, "ready") : send(503, "not-ready");
      case "/recipient":
        // The device-derived send recipient (send-doge); Maestro can't derive a device address.
        return control.recipient ? send(200, control.recipient) : send(503, "");
      case "/amount":
        return send(200, control.amount ?? "");
      case "/status":
        return send(200, JSON.stringify(control));
      default:
        return send(404, "not-found");
    }
  });
  // Don't let a stray port conflict crash the harness — the bridge/Speculos path is what matters.
  server.on("error", err => {
    // eslint-disable-next-line no-console
    console.warn(`[maestro-harness] control server error on :${port}: ${err}`);
  });
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `[maestro-harness] control HTTP server on :${port} (/ready /recipient /amount /status)`,
    );
  });
}

it("maestro backend: seed state + keep the bridge alive", async () => {
  // eslint-disable-next-line no-console
  console.log(`[maestro-harness] bridge listening on :${PORT} (flow=${FLOW}, full=${FULL})`);
  initBridge(PORT);
  startControlServer(CONTROL_PORT);

  if (FLOW === "swap") {
    await setupSwap();
  } else if (FLOW === "send-doge") {
    await setupSendDoge();
  } else if (FULL) {
    // Faithful path — exactly what app.init({ userdata, speculosApp }) does.
    // Imported lazily so seed-only mode never loads the Speculos/allure graph.
    // setupEnvironment() sets the env the Speculos path needs (E2E_NANO_APP_VERSION_PATH,
    // DETOX=1, MOCK="", DISABLE_APP_VERSION_REQUIREMENTS, ...) — normally done by Detox's setup.ts.
    const { setupEnvironment } = await import("../../helpers/commonHelpers");
    setupEnvironment();
    const { getUserdataPath } = await import("../../page/index");
    const { InitializationManager } = await import("../../utils/initUtil");
    const { Currency } = await import("@ledgerhq/live-common/e2e/enum/Currency");
    const { randomUUID } = await import("crypto");
    const fs = await import("fs");

    const tmp = `temp-userdata-${randomUUID()}`;
    const tmpPath = getUserdataPath(tmp);
    fs.copyFileSync(getUserdataPath(USERDATA), tmpPath);
    try {
      await InitializationManager.initialize(
        {
          userdata: USERDATA,
          speculosApp: Currency.ETH.speculosApp,
          featureFlags: { ...NO_ANALYTICS_PROMPT },
        },
        tmpPath,
        tmp,
      );
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
    // eslint-disable-next-line no-console
    console.log("[maestro-harness] Speculos(Ethereum) up + state seeded — ready for Maestro.");
  } else {
    // Seed-only: skip onboarding + set flags. No device, so discovery won't complete.
    // (setFeatureFlags awaits the app's response, so this resolves once the app connects.)
    await loadConfig(USERDATA, true);
    await setFeatureFlags(SEED_FLAGS);
    // eslint-disable-next-line no-console
    console.log("[maestro-harness] seed-only: onboarding skipped + flags set (no Speculos).");
  }

  // Signal the orchestrator that seeding is buffered and it's safe to launch the app.
  fs.mkdirSync(path.dirname(READY_FILE), { recursive: true });
  fs.writeFileSync(READY_FILE, String(Date.now()));
  control.ready = true; // also expose readiness over the control HTTP endpoint (onFlowStart hooks)

  // Block forever — keeps the bridge open while Maestro drives the app.
  await new Promise<void>(() => {});
}, 6_000_000);

/**
 * Swap (ETH -> ETH-USDT) backend, mirroring the Detox `beforeAllFunction` in
 * specs/swap/swap.ts + swap.setup.ts, MINUS the UI calls Maestro performs:
 *   - speculosApp = Exchange (signs the swap), with the coin app as a dependency
 *   - balances seeded via CLI live data (liveDataWithAddressCommand)
 *   - swap live app enabled via feature flag; swapSetup() points at the staging backend
 *   - device signing runs PROACTIVELY in the background: verifyAmountsAndAcceptSwap waits
 *     for the Speculos review screen, so it signs the moment Maestro taps "execute".
 * Imported lazily so add-account modes never load the swap/Speculos/allure graph.
 */
async function setupSwap(): Promise<void> {
  const { setupEnvironment } = await import("../../helpers/commonHelpers");
  setupEnvironment();

  const { getUserdataPath } = await import("../../page/index");
  const { InitializationManager } = await import("../../utils/initUtil");
  const { setExchangeDependencies } = await import("../../utils/speculosUtils");
  const { swapSetup } = await import("../../bridge/server");
  const { Swap } = await import("@ledgerhq/live-common/e2e/models/Swap");
  const { Account, TokenAccount } = await import("@ledgerhq/live-common/e2e/enum/Account");
  const { AppInfos } = await import("@ledgerhq/live-common/e2e/enum/AppInfos");
  const { Fee } = await import("@ledgerhq/live-common/e2e/enum/Fee");
  const { liveDataWithAddressCommand } = await import("@ledgerhq/live-common/e2e/cliCommandsUtils");
  const { verifyAmountsAndAcceptSwap } = await import("@ledgerhq/live-common/e2e/speculos");
  const { randomUUID } = await import("crypto");

  const amount = process.env.SWAP_AMOUNT ?? "0.01";
  const swap = new Swap(Account.ETH_1, TokenAccount.ETH_USDT_1, amount, undefined, Fee.MEDIUM);
  control.amount = amount; // exposed via GET /amount

  // Share the amount with the Maestro flow so it types the exact value the harness verifies.
  fs.mkdirSync(path.dirname(READY_FILE), { recursive: true });
  fs.writeFileSync(path.resolve("artifacts", ".maestro-swap-amount"), amount);

  // Exchange app needs the coin apps (Ethereum) as dependencies (app.speculos.setExchangeDependencies).
  setExchangeDependencies(
    [swap.accountToDebit, swap.accountToCredit].map(acc => ({
      name: acc.currency.speculosApp.name.replace(/ /g, "_"),
    })),
  );

  const tmp = `temp-userdata-${randomUUID()}`;
  const tmpPath = getUserdataPath(tmp);
  fs.copyFileSync(getUserdataPath(USERDATA), tmpPath);
  try {
    await InitializationManager.initialize(
      {
        userdata: USERDATA,
        speculosApp: AppInfos.EXCHANGE,
        featureFlags: {
          ptxSwapLiveAppMobile: {
            enabled: true,
            params: {
              manifest_id:
                process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws",
            },
          },
          llmModularDrawer: SEED_FLAGS.llmModularDrawer,
          ...NO_ANALYTICS_PROMPT,
          // lwmWallet40 left to InitializationManager's default (enabled = isWallet40 = true).
        },
        cliCommandsOnApp: [
          {
            app: swap.accountToDebit.currency.speculosApp,
            cmd: liveDataWithAddressCommand(swap.accountToDebit),
          },
          {
            app: swap.accountToCredit.currency.speculosApp,
            cmd: liveDataWithAddressCommand(swap.accountToCredit),
          },
        ],
      },
      tmpPath,
      tmp,
    );
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }

  await swapSetup();

  // NB: auto-pick is intentionally NOT enabled for swap — the flow drives the real native modular
  // drawer to pick the To currency (search USDT -> asset -> network -> account), exercising the
  // actual currency-selection UI on both platforms.

  // The Speculos screen-polling in verifyAmountsAndAcceptSwap uses axios. In this jest harness
  // axios resolves to its non-node build and (with no XMLHttpRequest) auto-selects the fetch
  // (undici) adapter, which fails against the Docker-forwarded Speculos port — every request
  // errors with ECONNREFUSED / "network error" even though a raw http.get to the same port
  // returns 200 (verified from inside this process). The harness jest config maps "axios" to its
  // node build; here we also pin the http adapter on the shared instance so verifyAmounts works.
  // Seeding is unaffected — it shells out to the CLI, not axios.
  const axios = (await import("axios")).default;
  axios.defaults.adapter = "http";

  // P0 fix: gate on the Speculos (Exchange) REST API actually being reachable before declaring
  // ready. createSpeculosDevice resolves "ready" ~500ms after the emulator core starts, BEFORE its
  // REST API (container port 40000, published to the host SPECULOS_API_PORT) accepts connections;
  // and after a setupMainSpeculosApp retry the container can be on a fresh port while the device
  // step still races the bind. The app's DMK device-proxy (DEVICE_PROXY_URL = http://127.0.0.1:
  // <port>) and this harness's signer both poll that port — if it isn't up, the swap dies with
  // GeneralDmkError (app) + ECONNREFUSED (harness). Poll until it answers so the device step has a
  // live device; surface a loud, specific warning (with container state) if it never does.
  await waitForSpeculosApiReady();

  // DIAGNOSTIC: record every distinct device screen the Exchange Speculos shows, so we can see the
  // exact sequence up to the `exit called (255)` — i.e. whether the Exchange shows a swap review
  // (and our signer mis-presses) or rejects the payload outright without a review. Read-only.
  startSpeculosScreenRecorder();

  // Background: retry until the Speculos "Review transaction" screen appears (Maestro has to
  // tap through the quote + the "Sign to swap" step first), then verify + sign. The `amount`
  // is matched as a substring of the on-device amount (verifySwapData uses contains), so a
  // stable prefix like "0.013" matches the live ~25% amount. Do NOT await.
  let connRefusedDiagDone = false;
  // DIAGNOSTIC: SWAP_NO_SIGN=1 disables the harness's button-pressing so ONLY the read-only screen
  // recorder observes the device. If the device then shows a stable review (instead of exit(255)),
  // the signer's presses were the culprit; if it still exit(255)s, the swap payload is rejected.
  const noSign = process.env.SWAP_NO_SIGN === "1";
  void (async () => {
    if (noSign) {
      // eslint-disable-next-line no-console
      console.log(
        "[maestro-harness] SWAP_NO_SIGN=1 — NOT signing; recorder observes the device only.",
      );
      return;
    }
    // Patient proactive signer (like send-doge): the swap UI takes ~2-3 min (WebView drawer +
    // quotes + provider + execute) before the device shows the review, so MOST attempts fail
    // "device not at review yet". Keep retrying until it is.
    const MAX_ATTEMPTS = 40;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await verifyAmountsAndAcceptSwap(swap, amount);
        // eslint-disable-next-line no-console
        console.log("[maestro-harness] swap signed on device");
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // One-time deep diagnostic the first time the REST API refuses: is the container still
        // alive? is the port still mapped? can the host still reach it? This distinguishes
        // "container/REST died" vs "Docker port-forward broke" vs "app's device-proxy connection
        // is starving the single-threaded Speculos HTTP API".
        if (!connRefusedDiagDone && /ECONNREFUSED|ECONNRESET|socket hang up/i.test(msg)) {
          connRefusedDiagDone = true;
          await dumpSpeculosConnDiag();
        }
        // Retriable = "device not at the review yet": the review screen isn't shown
        // ("not found on device/speculos screen" / ElementNotFoundException), OR the REST API
        // hasn't finished binding (ECONNREFUSED/... — createSpeculosDevice reports "ready" ~500ms
        // before the API accepts). Only a non-transient error ends the loop.
        const retriable =
          /not found on (device|speculos) screen|ElementNotFoundException|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EPIPE|socket hang up/i.test(
            msg,
          );
        if (retriable && attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        // eslint-disable-next-line no-console
        console.warn(`[maestro-harness] swap signing failed: ${msg}`);
        // Non-retriable failure (e.g. the Exchange pod returned HTTP 5xx = it crashed when the
        // wallet drove the swap signing). On remote Speculinho, pull the pod's own logs + status so
        // we see the ACTUAL crash reason ("the app kills the speculos"), not just our HTTP error.
        await dumpSpeculinhoLogsIfRemote(msg);
        // Also pull the APP's own logs over the bridge — the wallet's DMK error when it drove the
        // Exchange (e.g. the reason the Exchange rejected the swap init) is the missing piece.
        await dumpAppLogs();
        return;
      }
    }
  })();

  // Drive the WebView quote selection + execute via the in-app webview driver (Maestro can't
  // reliably tap the WebView keypad/quote/execute buttons). Runs in the background and polls until
  // Maestro has opened the swap screen + tapped "View quotes". Do NOT await.
  void driveSwapExecute();

  // eslint-disable-next-line no-console
  console.log(`[maestro-harness] swap backend ready (Exchange + Speculos, amount=${amount}).`);
}

/**
 * Drive the swap live-app WebView via the in-app webview driver (the qaa-1242 mechanism). Maestro
 * can drive the NATIVE parts (open swap, the modular-drawer currency pick, the 25% amount button)
 * but NOT the WebView's quote/execute buttons — their a11y-frame centres are clipped under the home
 * indicator (a by-text tap doesn't fire them) and the quote list re-renders ~every 20s (a by-point
 * tap races the re-render / lands on the wrong card). So the harness does the quote selection +
 * execute over the bridge, replicating Detox's swapLiveApp.selectExchange() + tapExecuteSwap():
 *   - wait for the quotes to render,
 *   - pick the first non-KYC, non-app provider in best-quote order (an app-requiring provider, e.g.
 *     1inch -> ONE_INCH / Uniswap -> ETHEREUM / Velora -> VELORA, makes the Speculos Exchange app
 *     os_lib_call into an app that is NOT installed as an Exchange dependency -> exit(255); only the
 *     coin app, Ethereum, is a dependency, so a non-app provider, e.g. MoonPay Trade / Changelly,
 *     signs cleanly),
 *   - select that quote card and click its execute button (a real DOM click).
 * The proactive signer above then accepts the swap on the Speculos the moment it reaches the device.
 */
async function driveSwapExecute(): Promise<void> {
  // iOS only. On Android the WebView is fully readable/tappable by Maestro (it drives the quotes +
  // execute in the flow), and the webviewDriver's synthetic DOM click — while it finds the elements —
  // does NOT trigger the live-app's React onClick on Android's WebView (it does on iOS WKWebView). So
  // the bridge-driven path is iOS-specific; skip it on Android.
  if ((process.env.MAESTRO_PLATFORM ?? "ios").toLowerCase() === "android") {
    // eslint-disable-next-line no-console
    console.log(
      "[maestro-harness] Android: Maestro drives the swap WebView (quotes/execute); skipping webviewDriver.",
    );
    return;
  }
  const { webviewDriver } = await import("../../bridge/server");
  const { SwapProvider } = await import("@ledgerhq/live-common/e2e/enum/Provider");
  const DRIVER = process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws";

  // Retry the bridge op while the WebView isn't registered yet (Maestro hasn't opened swap).
  type Op = Parameters<typeof webviewDriver>[1];
  const wv = async (op: Op, waitMs = 30000) => {
    const deadline = Date.now() + 180_000;
    while (Date.now() < deadline) {
      const r = await webviewDriver(DRIVER, op, waitMs);
      if (r.ok) return r;
      const err = (r as { error?: string }).error ?? "";
      if (/No webview registered/i.test(err)) {
        await new Promise(res => setTimeout(res, 2000));
        continue;
      }
      return r;
    }
    return { ok: false as const, error: "webview driver: timed out waiting for registration" };
  };

  // 0. Tap "View quotes" once Maestro has entered the To currency + amount (which enables it). This
  //    runs CONCURRENTLY with Maestro, so wait generously for the button to become enabled — the
  //    Android emulator drives the form noticeably slower than the iOS sim, and a short poll here
  //    expired before Maestro had set To+amount. The form sometimes auto-searches quotes (no button),
  //    so this is still best-effort: fall through and gate on the quotes appearing (step 1).
  let r = await wv(
    { op: "tapByTestIdWhenEnabled", testId: "mobile-get-quotes-button", timeoutMs: 110_000 },
    115_000,
  );
  if (!r.ok) {
    // eslint-disable-next-line no-console
    console.log(
      `[maestro-harness] webviewDriver: "View quotes" not tapped (${(r as { error?: string }).error}) — form may auto-search; waiting for quotes.`,
    );
  }

  // 1. Wait for the quotes to render (the real gate — whether tapped or auto-searched).
  r = await wv({ op: "waitForTestId", testId: "number-of-quotes", timeoutMs: 120_000 }, 125_000);
  if (!r.ok) {
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness] webviewDriver: quotes never appeared: ${(r as { error?: string }).error}`,
    );
    return;
  }

  // 2. Read the provider uiNames in best-quote (DOM) order.
  r = await wv({
    op: "querySelectorAllText",
    selector: "[data-testid^='compact-quote-card-provider-name-']",
  });
  const uiNames = (r.ok ? (r.data as string[]) ?? [] : []).filter(Boolean);

  // 3. Pick the first non-KYC, non-app provider (skip LI.FI) — exactly like Detox selectExchange.
  let picked: { name: string; uiName: string } | undefined;
  for (const uiName of uiNames) {
    const p = SwapProvider.getByUiName(uiName);
    if (p && !p.kyc && !p.app && p.uiName !== SwapProvider.LIFI.uiName) {
      picked = p;
      break;
    }
  }
  if (!picked) {
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness] webviewDriver: no non-app provider in quotes: [${uiNames.join(", ")}]`,
    );
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[maestro-harness] webviewDriver picked provider: ${picked.uiName} (${picked.name})`);

  // 4. Select the provider's quote card.
  r = await wv({ op: "tapByTestId", testId: `compact-quote-card-provider-name-${picked.name}` });
  if (!r.ok) {
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness] webviewDriver: failed selecting provider: ${(r as { error?: string }).error}`,
    );
    return;
  }

  // 5. Click that card's execute button (scoped CSS like Detox providerExecuteButtonCss). This
  //    sends the swap to the device; the proactive signer accepts it on the Speculos.
  r = await wv(
    {
      op: "tapBySelectorWhenEnabled",
      selector: `[data-testid^="quote-container-${picked.name}"] [data-testid="execute-button"]`,
      timeoutMs: 25_000,
    },
    30_000,
  );
  if (!r.ok) {
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness] webviewDriver: failed tapping execute: ${(r as { error?: string }).error}`,
    );
    return;
  }
  // eslint-disable-next-line no-console
  console.log("[maestro-harness] swap executed via webviewDriver — waiting for device review.");
}

/**
 * Send DOGE (Dogecoin 1 -> Dogecoin 2) backend, mirroring the Detox `send.ts` beforeAllFunction for
 * sendDOGE.spec.ts MINUS the UI calls Maestro performs. Native flow: ONE Dogecoin Speculos, no
 * Exchange handoff, no WebView.
 *   - cliCommandsOnApp seed Dogecoin 1 (debit) + derive Dogecoin 2 (recipient) on the same Doge
 *     Speculos. The recipient is computed here (in cliCommandsOnApp, which runs BEFORE the
 *     app-dependent init steps) and written to artifacts/.maestro-send-recipient so the orchestrator
 *     can pass it to Maestro via `maestro test -e RECIPIENT=<addr>` (Maestro can't derive a device
 *     address itself).
 *   - Maestro navigates the UI itself (portfolio -> assetItem-Dogecoin -> asset-quick-action-button-send),
 *     so the harness does no app navigation (iOS deeplinks hit the SpringBoard dialog).
 *   - device signing runs proactively: signSendTransaction waits for the review then signs.
 */
async function setupSendDoge(): Promise<void> {
  const { setupEnvironment } = await import("../../helpers/commonHelpers");
  setupEnvironment();

  const { getUserdataPath } = await import("../../page/index");
  const { InitializationManager } = await import("../../utils/initUtil");
  const { Account } = await import("@ledgerhq/live-common/e2e/enum/Account");
  const { Fee } = await import("@ledgerhq/live-common/e2e/enum/Fee");
  const { Transaction } = await import("@ledgerhq/live-common/e2e/models/Transaction");
  const { liveDataWithAddressCommand, getAccountAddress } = await import(
    "@ledgerhq/live-common/e2e/cliCommandsUtils"
  );
  const { signSendTransaction } = await import("@ledgerhq/live-common/e2e/speculos");
  const { randomUUID } = await import("crypto");

  const amount = process.env.SEND_AMOUNT ?? "0.01";
  const tx = new Transaction(Account.DOGE_1, Account.DOGE_2, amount, Fee.SLOW);
  const dogeApp = tx.accountToDebit.currency.speculosApp;

  const recipientFile = path.resolve("artifacts", ".maestro-send-recipient");
  fs.mkdirSync(path.dirname(recipientFile), { recursive: true });
  // Stale recipient from a previous run must not be picked up by the orchestrator.
  if (fs.existsSync(recipientFile)) fs.unlinkSync(recipientFile);
  fs.writeFileSync(path.resolve("artifacts", ".maestro-send-amount"), amount);
  control.amount = amount; // exposed via GET /amount

  const tmp = `temp-userdata-${randomUUID()}`;
  const tmpPath = getUserdataPath(tmp);
  fs.copyFileSync(getUserdataPath(USERDATA), tmpPath);
  try {
    await InitializationManager.initialize(
      {
        userdata: USERDATA,
        speculosApp: dogeApp,
        featureFlags: { ...NO_ANALYTICS_PROMPT },
        cliCommandsOnApp: [
          { app: dogeApp, cmd: liveDataWithAddressCommand(tx.accountToDebit) },
          {
            app: dogeApp,
            cmd: async (_userdataPath?: string) => {
              const address = await getAccountAddress(tx.accountToCredit);
              tx.accountToCredit.address = address;
              tx.recipientAddress = address;
              fs.writeFileSync(recipientFile, address);
              control.recipient = address; // exposed via GET /recipient (flow fetches it itself)
              // eslint-disable-next-line no-console
              console.log(`[maestro-harness] send recipient (Dogecoin 2) = ${address}`);
              return address;
            },
          },
        ],
      },
      tmpPath,
      tmp,
    );
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }

  // Pin the axios http adapter (same rationale as swap) for the Speculos screen polling/signing.
  const axios = (await import("axios")).default;
  axios.defaults.adapter = "http";

  await waitForSpeculosApiReady();
  startSpeculosScreenRecorder();

  // Proactively sign the send tx the moment the device shows its review (the Maestro flow drives the
  // app to the device step; the signer just waits for the review screen, then signs).
  void (async () => {
    // The signer runs proactively from setup while Maestro drives the UI (~2 min) to the device
    // step, so MOST attempts fail with "the device isn't at the review yet". The coin-app navigation
    // helper throws ElementNotFoundException "... not found on speculos screen" (note: "speculos",
    // not "device") while the device sits on its idle screens — that is RETRIABLE. Keep retrying
    // until the device shows the review, then sign.
    const MAX_ATTEMPTS = 40;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await signSendTransaction(tx);
        // eslint-disable-next-line no-console
        console.log("[maestro-harness] send tx signed on device");
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const retriable =
          /not found on (device|speculos) screen|ElementNotFoundException|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EPIPE|socket hang up/i.test(
            msg,
          );
        if (retriable && attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        // eslint-disable-next-line no-console
        console.warn(`[maestro-harness] send signing failed: ${msg}`);
        await dumpSpeculinhoLogsIfRemote(msg);
        return;
      }
    }
  })();

  // eslint-disable-next-line no-console
  console.log(`[maestro-harness] send-doge backend ready (Dogecoin + Speculos, amount=${amount}).`);
}

/**
 * One-time diagnostic dumped when the signer first hits ECONNREFUSED at the device step: re-probes
 * the Speculos /events endpoint and (local Docker only) the container state — so we can tell apart
 * "container/REST died", "port-forward broke", "device-proxy starving the local HTTP API", and (for
 * remote Speculinho) "VPN/network dropped".
 */
async function dumpSpeculosConnDiag(): Promise<void> {
  try {
    const { isSpeculosRemote } = await import("../../helpers/commonHelpers");
    const url = await speculosEventsUrl();
    const probe = await probeHttp(url);
    let extra = "";
    if (!isSpeculosRemote()) {
      const cp = await import("child_process");
      const image = process.env.SPECULOS_IMAGE_TAG ?? "ghcr.io/ledgerhq/speculos:latest";
      try {
        extra =
          "\n  containers:\n" +
          cp
            .execSync(
              `docker ps -a --filter ancestor=${image} --format '{{.ID}} state={{.State}} status={{.Status}} ports={{.Ports}}'`,
            )
            .toString()
            .trim();
      } catch (e) {
        extra = `\n  (docker ps failed: ${e instanceof Error ? e.message : String(e)})`;
      }
    }
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness][CONN-DIAG] at first ECONNREFUSED:\n  probe ${url} = ${probe}${extra}`,
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness][CONN-DIAG] failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * On a remote Speculinho run, fetch the Exchange pod's own status + stderr logs after a signing
 * failure. The run_id is the first label of SPECULOS_ADDRESS's host (e.g. "exchange-<suffix>" from
 * https://exchange-<suffix>.speculos.ledgerlabs.net). This surfaces WHY the pod died (Speculos
 * panic / Exchange app crash / unsupported APDU) instead of just our HTTP 5xx.
 */
async function dumpSpeculinhoLogsIfRemote(failureMsg: string): Promise<void> {
  try {
    const { isSpeculosRemote } = await import("../../helpers/commonHelpers");
    if (!isSpeculosRemote()) return;
    const addr = process.env.SPECULOS_ADDRESS;
    if (!addr) {
      // eslint-disable-next-line no-console
      console.warn(
        "[maestro-harness][POD-LOGS] SPECULOS_ADDRESS is unset — cannot fetch pod logs.",
      );
      return;
    }
    const runId = new URL(addr).hostname.split(".")[0];
    const { fetchSpeculinhoLogs, fetchSpeculinhoStatus } = await import(
      "@ledgerhq/live-common/e2e/speculosCI"
    );
    const status = await fetchSpeculinhoStatus(runId);
    const logs = await fetchSpeculinhoLogs(runId);
    const tail = logs.split("\n").slice(-80).join("\n");
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness][POD-LOGS] Exchange pod "${runId}" after signing failure (${failureMsg}):\n` +
        `--- /status ---\n${status}\n--- /logs (tail) ---\n${tail}`,
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness][POD-LOGS] failed to fetch Speculinho logs: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * Pull the app's own logs over the bridge (getLogs) and print the tail — surfaces the wallet-side
 * DMK error when it drove the Exchange (e.g. why the Exchange rejected the swap init / exit(255)).
 */
async function dumpAppLogs(): Promise<void> {
  try {
    const { getLogs } = await import("../../bridge/server");
    const logs = await getLogs();
    const text = typeof logs === "string" ? logs : JSON.stringify(logs);
    if (!text || text === "{}" || text === '""') {
      // eslint-disable-next-line no-console
      console.warn("[maestro-harness][APP-LOGS] empty (app did not return logs / timed out).");
      return;
    }
    const lines = text.split(/\\n|\n/);
    const interesting = lines.filter(l =>
      /dmk|exchange|swap|error|reject|sign|transport|speculos|device/i.test(l),
    );
    const tail = (interesting.length ? interesting : lines).slice(-60).join("\n");
    // eslint-disable-next-line no-console
    console.warn(`[maestro-harness][APP-LOGS] (filtered tail):\n${tail.slice(-4000)}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      `[maestro-harness][APP-LOGS] failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * The exact Speculos /events URL the signer polls. Resolves to local Docker (http://127.0.0.1:<port>)
 * or remote Speculinho (https://<host>:443) depending on SPECULOS_ADDRESS — same construction as
 * fetchCurrentScreenTexts in live-common, so the gate/diag probe exactly what the signer will hit.
 */
async function speculosEventsUrl(): Promise<string> {
  const { getEnv } = await import("@ledgerhq/live-env");
  const { getSpeculosAddress } = await import("@ledgerhq/live-common/e2e/speculos");
  const port = getEnv("SPECULOS_API_PORT");
  return `${getSpeculosAddress()}:${port}/events?stream=false&currentscreenonly=true`;
}

/**
 * Direct GET of the Speculos /events endpoint, returning the joined on-screen text. Unlike
 * live-common's fetchCurrentScreenTexts this does NOT use the retry/axios wrapper, so it polls fast
 * (good for a screen recorder). Throws on non-200 (e.g. the pod going 503 after exit 255).
 */
async function fetchScreenTextDirect(): Promise<string> {
  const url = await speculosEventsUrl();
  const mod = (
    url.startsWith("https:") ? await import("https") : await import("http")
  ) as typeof import("http");
  return new Promise<string>((resolve, reject) => {
    const req = mod.get(url, res => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let body = "";
      res.on("data", c => (body += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(body) as { events?: { text?: string }[] };
          const texts = Array.isArray(json.events)
            ? json.events
                .map(e => e.text ?? "")
                .join(" ")
                .trim()
            : "";
          resolve(texts);
        } catch {
          resolve(body.slice(0, 200));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error("TIMEOUT"));
    });
  });
}

/**
 * Background recorder: polls the (Exchange) Speculos screen and logs each distinct screen with a
 * timestamp. Runs forever alongside the signer; the orchestrator kills it on exit. The sequence it
 * prints is the ground truth for what the device displayed before `exit called (255)`.
 */
function startSpeculosScreenRecorder(): void {
  void (async () => {
    let last = "";
    let logged = 0;
    const MAX = 500;
    for (;;) {
      let line: string;
      try {
        line = `SCREEN: ${await fetchScreenTextDirect()}`;
      } catch (e) {
        line = `(poll error) ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`;
      }
      if (line && line !== last) {
        last = line;
        if (logged++ < MAX) {
          // eslint-disable-next-line no-console
          console.log(
            `[maestro-harness][SCREEN] ${new Date().toISOString().slice(11, 23)} | ${line}`,
          );
        }
      }
      await new Promise(r => setTimeout(r, 800));
    }
  })();
}

/** GET a URL (http or https), resolving to a short status string ("HTTP 200" / "ERR ..." / "TIMEOUT"). */
async function probeHttp(url: string, timeoutMs = 4000): Promise<string> {
  const mod = (
    url.startsWith("https:") ? await import("https") : await import("http")
  ) as typeof import("http");
  return new Promise<string>(resolve => {
    const req = mod.get(url, res => {
      resolve(`HTTP ${res.statusCode}`);
      res.resume();
    });
    req.on("error", e => resolve(`ERR ${(e as Error).message}`));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve("TIMEOUT");
    });
  });
}

/**
 * Poll the registered Speculos REST API until it answers, so the swap's on-device step talks to a
 * live device. Works for BOTH local Docker (http://127.0.0.1:<port>) and remote Speculinho
 * (https://<host>:443). For local it covers the "createSpeculosDevice reports ready ~500ms before
 * the REST API binds" race; for remote it catches VPN/network unreachability early. The signer
 * (verifyAmountsAndAcceptSwap) re-reads the address+port on every poll.
 */
async function waitForSpeculosApiReady(attempts = 30, delayMs = 2000): Promise<void> {
  const { isSpeculosRemote } = await import("../../helpers/commonHelpers");
  const remote = isSpeculosRemote();
  const cp = await import("child_process");
  const image = process.env.SPECULOS_IMAGE_TAG ?? "ghcr.io/ledgerhq/speculos:latest";
  const containersNote = () => {
    if (remote) return "";
    try {
      return `; live containers:\n${cp
        .execSync(`docker ps --filter ancestor=${image} --format '{{.ID}} {{.Ports}}'`)
        .toString()
        .trim()}`;
    } catch {
      return "; (docker ps failed)";
    }
  };
  for (let i = 1; i <= attempts; i++) {
    const url = await speculosEventsUrl();
    const probe = await probeHttp(url);
    if (probe.startsWith("HTTP")) {
      // eslint-disable-next-line no-console
      console.log(
        `[maestro-harness] Speculos REST API reachable at ${url} (${probe}) — device signing can proceed.`,
      );
      return;
    }
    if (i === 1 || i % 5 === 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[maestro-harness] waiting for Speculos REST API at ${url} (attempt ${i}/${attempts}, last=${probe})${containersNote()}`,
      );
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  const url = await speculosEventsUrl();
  // eslint-disable-next-line no-console
  console.warn(
    `[maestro-harness] WARNING: Speculos REST API at ${url} never became reachable after ${attempts} ` +
      `attempts. The swap will fail at "Connect device" (GeneralDmkError) and the signer will get ECONNREFUSED.${containersNote()}`,
  );
}
