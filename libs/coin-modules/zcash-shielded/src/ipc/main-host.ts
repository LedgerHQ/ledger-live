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
 *
 * Host-only: this module MUST only be imported from the Electron main
 * process. It calls `require("electron")` lazily (inside `getElectron()`)
 * rather than at import time so the file stays importable from non-Electron
 * contexts (Jest, typecheck in the lib itself). Electron is not a dependency
 * of this package on purpose — the consuming app (e.g. ledger-live-desktop)
 * provides it at runtime.
 */

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
} from "./contract";
import { OneShotResolver } from "./one-shot-router";

const LOG_TYPE = "zcash-native-host";

// ─── Minimal structural types for Electron ──────────────────────────────────
//
// We avoid `import type { ... } from "electron"` so the lib itself doesn't
// need Electron in its dependency tree (tests, mobile, non-Electron Node
// environments can still `tsc` this file). The actual Electron module is
// required lazily inside `getElectron()` and this narrow surface is all the
// host needs.

type IpcEventLike = { sender: { id: number } };

/**
 * Narrow, generic handler shape: each channel carries exactly one args
 * payload. Matches Electron's real `ipcMain.handle` at the usage sites we
 * need, and lets callers pass a precisely-typed handler instead of juggling
 * `unknown[]`.
 */
type IpcMainLike = {
  handle<TArgs, TResult>(
    channel: string,
    listener: (event: IpcEventLike, args: TArgs) => Promise<TResult> | TResult,
  ): void;
};

type WebContentsLike = {
  send(channel: string, payload: unknown): void;
  isDestroyed(): boolean;
};

type WebContentsStaticLike = {
  fromId(id: number): WebContentsLike | undefined | null;
};

type UtilityProcessLike = {
  stdout?: { on(event: "data", listener: (chunk: unknown) => void): void } | null;
  stderr?: { on(event: "data", listener: (chunk: unknown) => void): void } | null;
  once(event: "spawn", listener: () => void): void;
  once(event: "exit", listener: (code: number) => void): void;
  on(event: "message", listener: (msg: UtilityOutboundMessage) => void): void;
  on(event: "exit", listener: (code: number) => void): void;
  postMessage(msg: UtilityInboundMessage): void;
  kill(): void;
};

type UtilityProcessStaticLike = {
  fork(
    modulePath: string,
    args: string[],
    options: { stdio: "pipe" | "inherit" },
  ): UtilityProcessLike;
};

type ElectronApi = {
  app: { on(event: "before-quit", listener: () => void): void };
  ipcMain: IpcMainLike;
  utilityProcess: UtilityProcessStaticLike;
  webContents: WebContentsStaticLike;
};

let cachedElectron: ElectronApi | null = null;

function getElectron(): ElectronApi {
  if (cachedElectron) return cachedElectron;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require("electron") as ElectronApi;
  if (!electron?.ipcMain || !electron.utilityProcess || !electron.webContents || !electron.app) {
    throw new Error(
      "zcash main-host: expected to run in the Electron main process (ipcMain/utilityProcess/webContents/app missing)",
    );
  }
  cachedElectron = electron;
  return cachedElectron;
}

// ─── Host state ─────────────────────────────────────────────────────────────

/**
 * Tracks which `webContents` id initiated each in-flight sync request, so
 * `zcash:stream` events are routed back to the originating window only.
 * `getChainTip` and other one-shot calls don't need this — their reply flows
 * back through the `ipcMain.handle` promise, not `zcash:stream`.
 */
type PendingSync = {
  webContentsId: number;
};

type HostState = {
  utility: UtilityProcessLike | null;
  /** Resolves once the utility has emitted its `spawn` event (i.e. `postMessage` is safe). */
  spawnReady: Promise<void> | null;
  pendingSyncs: Map<RequestId, PendingSync>;
  /**
   * One-shot resolvers, one per request/response method. When you add a new
   * one-shot method to the contract, create a fresh {@link OneShotResolver}
   * here and wire its `resolve` / `reject` to the matching cases in
   * {@link handleUtilityMessage}.
   */
  resolvers: {
    chainTip: OneShotResolver<number>;
  };
};

const state: HostState = {
  utility: null,
  spawnReady: null,
  pendingSyncs: new Map(),
  resolvers: {
    chainTip: new OneShotResolver<number>("chain-tip"),
  },
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

function ensureUtility(): { utility: UtilityProcessLike; spawnReady: Promise<void> } {
  if (state.utility && state.spawnReady) {
    return { utility: state.utility, spawnReady: state.spawnReady };
  }

  const { utilityProcess } = getElectron();
  const bundlePath = resolveUtilityBundlePath();
  log(LOG_TYPE, "spawning zcash utility process", { bundlePath });

  const utility = utilityProcess.fork(bundlePath, [], {
    // `pipe` so stdout/stderr of the utility end up in the main process logs,
    // which is what a developer expects when tailing Electron output.
    stdio: "pipe",
  });
  state.utility = utility;

  const spawnReady = new Promise<void>((resolve, reject) => {
    utility.once("spawn", () => resolve());
    utility.once("exit", (code: number) =>
      reject(new Error(`zcash utility exited before spawn (code ${code})`)),
    );
  });
  state.spawnReady = spawnReady;

  utility.stdout?.on("data", (chunk: unknown) =>
    log(LOG_TYPE, "utility stdout", { chunk: String(chunk) }),
  );
  utility.stderr?.on("data", (chunk: unknown) =>
    log(LOG_TYPE, "utility stderr", { chunk: String(chunk) }),
  );

  utility.on("message", (msg: UtilityOutboundMessage) => handleUtilityMessage(msg));

  utility.on("exit", (code: number) => {
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

  for (const resolver of Object.values(state.resolvers)) {
    resolver.failAll(err);
  }
}

function handleUtilityMessage(msg: UtilityOutboundMessage): void {
  switch (msg.type) {
    case "chain-tip": {
      if (!state.resolvers.chainTip.resolve(msg.requestId, msg.height)) {
        log(LOG_TYPE, "chain-tip reply for unknown requestId", { requestId: msg.requestId });
      }
      return;
    }
    case "chain-tip-error": {
      if (!state.resolvers.chainTip.reject(msg.requestId, new Error(msg.message))) {
        log(LOG_TYPE, "chain-tip-error for unknown requestId", { requestId: msg.requestId });
      }
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
  const { webContents } = getElectron();
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
  const { ipcMain } = getElectron();

  ipcMain.handle<GetChainTipArgs, number>(
    ZCASH_IPC.getChainTip,
    (_event, args): Promise<number> =>
      state.resolvers.chainTip.register(args.requestId, () =>
        postToUtility({ type: "get-chain-tip", args }),
      ),
  );

  ipcMain.handle<StartSyncArgs, void>(ZCASH_IPC.startSync, async (event, args): Promise<void> => {
    state.pendingSyncs.set(args.requestId, { webContentsId: event.sender.id });
    try {
      await postToUtility({ type: "start-sync", args });
    } catch (err) {
      state.pendingSyncs.delete(args.requestId);
      throw err;
    }
  });

  ipcMain.handle<CancelSyncArgs, void>(
    ZCASH_IPC.cancelSync,
    async (_event, args): Promise<void> => {
      // Whether or not the utility already finished, posting a cancel is cheap
      // and the utility handles unknown ids gracefully. Don't `await` — cancel
      // must not block the renderer for longer than a single IPC round-trip.
      if (!state.utility) return;
      try {
        await postToUtility({ type: "cancel-sync", args });
      } finally {
        state.pendingSyncs.delete(args.requestId);
      }
    },
  );
}

/**
 * Wires up the ZCash IPC handlers and the utility lifecycle. Call once from
 * the main entry point, e.g. next to `setupTransportHandlers()`.
 */
export function setupZcashNativeHost(): void {
  log(LOG_TYPE, "setting up zcash native host");
  registerHandlers();

  const { app } = getElectron();
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
