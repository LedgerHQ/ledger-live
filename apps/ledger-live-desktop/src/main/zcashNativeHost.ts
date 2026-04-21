/**
 * Main-process bridge between the renderer's ZCashNative client and the
 * UtilityProcess that hosts the napi-rs Rust engine.
 *
 * Role:
 *   1. Own a single long-lived UtilityProcess (spawned on first use).
 *   2. Accept IPC requests from the renderer (`zcash:getChainTip`,
 *      `zcash:startSync`, `zcash:cancelSync`).
 *   3. Forward them down the `parentPort` to the utility, and relay the
 *      utility's replies back to the originating `webContents` via
 *      `zcash:stream`.
 *
 * Why a dedicated UtilityProcess:
 * - Isolates the `.node` addon from renderer and main, so a Rust panic can't
 *   take either down.
 * - Unblocks turning `nodeIntegration` off in the renderer — the renderer no
 *   longer `require()`s the native module directly.
 */

import { app, ipcMain, utilityProcess, type UtilityProcess } from "electron";
import path from "path";
import { log } from "@ledgerhq/logs";
import {
  ZCASH_IPC,
  type CancelSyncArgs,
  type GetChainTipArgs,
  type RequestId,
  type StartSyncArgs,
  type StreamEvent,
  type UtilityInboundMessage,
  type UtilityOutboundMessage,
} from "@ledgerhq/zcash-shielded/native-engine/contract";

const LOG_TYPE = "zcash-native-host";

/**
 * Tracks which `webContents` id initiated each in-flight sync request, so
 * `zcash:stream` events are routed back to the originating window only.
 * `getChainTip` is requested/replied via `invoke` so it isn't tracked here.
 */
type PendingSync = {
  webContentsId: number;
};

type ChainTipResolver = {
  resolve: (height: number) => void;
  reject: (err: Error) => void;
};

type HostState = {
  utility: UtilityProcess | null;
  /** Resolves once the utility has emitted its `spawn` event (i.e. `postMessage` is safe). */
  spawnReady: Promise<void> | null;
  pendingSyncs: Map<RequestId, PendingSync>;
  pendingChainTips: Map<RequestId, ChainTipResolver>;
};

const state: HostState = {
  utility: null,
  spawnReady: null,
  pendingSyncs: new Map(),
  pendingChainTips: new Map(),
};

/**
 * Resolves to the path of the bundled UtilityProcess entry.
 *
 * Both dev and prod builds emit it alongside `main.bundle.js` in `.webpack/`
 * (see `rspack.zcashUtility.ts`), and `__dirname` at runtime points to that
 * directory — so a single resolution works for both.
 */
function resolveUtilityBundlePath(): string {
  return path.join(__dirname, "zcash-utility.bundle.js");
}

function ensureUtility(): { utility: UtilityProcess; spawnReady: Promise<void> } {
  if (state.utility && state.spawnReady) {
    return { utility: state.utility, spawnReady: state.spawnReady };
  }

  const bundlePath = resolveUtilityBundlePath();
  log(LOG_TYPE, "spawning zcash utility process", { bundlePath });

  const utility = utilityProcess.fork(bundlePath, [], {
    // `pipe` so stdout/stderr of the utility end up in the main process logs,
    // which is what a developer expects when tailing Electron output.
    stdio: "pipe",
  });
  state.utility = utility;

  const spawnReady = new Promise<void>((resolve, reject) => {
    const onSpawn = () => resolve();
    const onExitBeforeSpawn = (code: number) =>
      reject(new Error(`zcash utility exited before spawn (code ${code})`));
    utility.once("spawn", onSpawn);
    utility.once("exit", onExitBeforeSpawn);
  });
  state.spawnReady = spawnReady;

  utility.stdout?.on("data", chunk => log(LOG_TYPE, "utility stdout", { chunk: String(chunk) }));
  utility.stderr?.on("data", chunk => log(LOG_TYPE, "utility stderr", { chunk: String(chunk) }));

  utility.on("message", (msg: UtilityOutboundMessage) => handleUtilityMessage(msg));

  utility.on("exit", code => {
    log(LOG_TYPE, "zcash utility exited", { code });
    // Fail any in-flight requests so callers don't hang forever.
    failAllPending(new Error(`zcash utility exited (code ${code})`));
    state.utility = null;
    state.spawnReady = null;
  });

  return { utility, spawnReady };
}

function failAllPending(err: Error): void {
  for (const [requestId, sync] of state.pendingSyncs) {
    sendStreamEvent(sync.webContentsId, { requestId, kind: "error", message: err.message });
  }
  state.pendingSyncs.clear();

  for (const resolver of state.pendingChainTips.values()) {
    resolver.reject(err);
  }
  state.pendingChainTips.clear();
}

function handleUtilityMessage(msg: UtilityOutboundMessage): void {
  switch (msg.type) {
    case "chain-tip": {
      const resolver = state.pendingChainTips.get(msg.requestId);
      state.pendingChainTips.delete(msg.requestId);
      resolver?.resolve(msg.height);
      return;
    }
    case "chain-tip-error": {
      const resolver = state.pendingChainTips.get(msg.requestId);
      state.pendingChainTips.delete(msg.requestId);
      resolver?.reject(new Error(msg.message));
      return;
    }
    case "stream": {
      const sync = state.pendingSyncs.get(msg.event.requestId);
      if (!sync) {
        log(LOG_TYPE, "stream event for unknown requestId", {
          requestId: msg.event.requestId,
          kind: msg.event.kind,
        });
        return;
      }
      sendStreamEvent(sync.webContentsId, msg.event);
      if (msg.event.kind === "complete" || msg.event.kind === "error") {
        state.pendingSyncs.delete(msg.event.requestId);
      }
      return;
    }
    default: {
      const exhaustive: never = msg;
      log(LOG_TYPE, "unknown utility message", { msg: exhaustive });
    }
  }
}

function sendStreamEvent(webContentsId: number, event: StreamEvent): void {
  // Resolve webContents lazily — it might have been destroyed (window closed)
  // between the request and the reply. `fromId` returns undefined in that case.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webContents } = require("electron") as typeof import("electron");
  const wc = webContents.fromId(webContentsId);
  if (!wc || wc.isDestroyed()) {
    log(LOG_TYPE, "dropping stream event — webContents destroyed", {
      webContentsId,
      requestId: event.requestId,
      kind: event.kind,
    });
    return;
  }
  wc.send(ZCASH_IPC.stream, event);
}

async function postToUtility(msg: UtilityInboundMessage): Promise<void> {
  const { utility, spawnReady } = ensureUtility();
  await spawnReady;
  utility.postMessage(msg);
}

function registerHandlers(): void {
  ipcMain.handle(ZCASH_IPC.getChainTip, async (_event, args: GetChainTipArgs): Promise<number> => {
    const resultPromise = new Promise<number>((resolve, reject) => {
      state.pendingChainTips.set(args.requestId, { resolve, reject });
    });
    try {
      await postToUtility({ type: "get-chain-tip", args });
      return await resultPromise;
    } catch (err) {
      state.pendingChainTips.delete(args.requestId);
      throw err;
    }
  });

  ipcMain.handle(ZCASH_IPC.startSync, async (event, args: StartSyncArgs): Promise<void> => {
    state.pendingSyncs.set(args.requestId, { webContentsId: event.sender.id });
    try {
      await postToUtility({ type: "start-sync", args });
    } catch (err) {
      state.pendingSyncs.delete(args.requestId);
      throw err;
    }
  });

  ipcMain.handle(ZCASH_IPC.cancelSync, async (_event, args: CancelSyncArgs): Promise<void> => {
    // Whether or not the utility already finished, posting a cancel is cheap
    // and the utility handles unknown ids gracefully. Don't `await` — cancel
    // must not block the renderer for longer than a single IPC round-trip.
    if (!state.utility) return;
    try {
      await postToUtility({ type: "cancel-sync", args });
    } finally {
      state.pendingSyncs.delete(args.requestId);
    }
  });
}

/**
 * Wires up the ZCash IPC handlers and the utility lifecycle. Call once from
 * the main entry point, e.g. next to `setupTransportHandlers()`.
 */
export function setupZcashNativeHost(): void {
  log(LOG_TYPE, "setting up zcash native host");
  registerHandlers();

  app.on("before-quit", () => {
    cleanupZcashNativeHost();
  });
}

/**
 * Kills the UtilityProcess if running and clears in-flight state. Exposed for
 * tests and for integration with the existing `window-all-closed` teardown.
 */
export function cleanupZcashNativeHost(): void {
  const utility = state.utility;
  if (!utility) return;
  log(LOG_TYPE, "cleanup — killing zcash utility");
  failAllPending(new Error("zcash utility shutting down"));
  try {
    utility.kill();
  } catch (err) {
    log(LOG_TYPE, "cleanup — utility.kill() threw", { err: String(err) });
  }
  state.utility = null;
  state.spawnReady = null;
}
