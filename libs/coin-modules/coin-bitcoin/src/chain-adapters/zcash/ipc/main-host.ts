/**
 * Main-process bridge between the renderer's ZCash client and the
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
 * - Unblocks turning `nodeIntegration` off in the renderer -- the renderer no
 *   longer `require()`s the native module directly.
 *
 * Host-only: this module MUST only be imported from the Electron main
 * process. It calls `require("electron")` lazily (inside `getElectron()`)
 * rather than at import time so the file stays importable from non-Electron
 * contexts (Jest, typecheck in the lib itself). Electron is not a dependency
 * of this package on purpose -- the consuming app (e.g. ledger-live-desktop)
 * provides it at runtime.
 */

import path from "path";
import { log } from "@ledgerhq/logs";
import {
  ZCASH_IPC,
  type CancelSyncArgs,
  type FindBlockHeightArgs,
  type GetChainTipArgs,
  type RequestId,
  type StartSyncArgs,
  type StreamEvent,
  type UtilityInboundMessage,
  type UtilityOutboundMessage,
} from "./contract";
import type {
  BuildTransactionArgs,
  BuildTransactionResult,
  BuildIronwoodTransactionArgs,
  BuildIronwoodTransactionResult,
  FinalizeTransactionArgs,
  FinalizeTransactionResult,
  BroadcastTransactionArgs,
  TransactionDetailsArgs,
  TransactionDetailsResult,
} from "../types";
import { OneShotResolver } from "./one-shot-router";

const LOG_TYPE = "zcash-native-host";

// --- Minimal structural types for Electron ---
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

// --- Host state ---

/**
 * Tracks which `webContents` id initiated each in-flight sync request, so
 * `zcash:stream` events are routed back to the originating window only.
 * `getChainTip` and other one-shot calls don't need this -- their reply flows
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
    blockHeight: OneShotResolver<number>;
    buildTx: OneShotResolver<BuildTransactionResult>;
    buildIronwoodTx: OneShotResolver<BuildIronwoodTransactionResult>;
    finalizeTx: OneShotResolver<FinalizeTransactionResult>;
    broadcastTx: OneShotResolver<string>;
    transactionDetails: OneShotResolver<TransactionDetailsResult[]>;
  };
};

const state: HostState = {
  utility: null,
  spawnReady: null,
  pendingSyncs: new Map(),
  resolvers: {
    chainTip: new OneShotResolver<number>("chain-tip"),
    blockHeight: new OneShotResolver<number>("block-height"),
    buildTx: new OneShotResolver<BuildTransactionResult>("build-transaction"),
    buildIronwoodTx: new OneShotResolver<BuildIronwoodTransactionResult>(
      "build-ironwood-transaction",
    ),
    finalizeTx: new OneShotResolver<FinalizeTransactionResult>("finalize-transaction"),
    broadcastTx: new OneShotResolver<string>("broadcast-transaction"),
    transactionDetails: new OneShotResolver<TransactionDetailsResult[]>("transaction-details"),
  },
};

/**
 * Resolves to the path of the bundled UtilityProcess entry.
 *
 * Both dev and prod builds emit it alongside `main.bundle.js` in `.webpack/`
 * (see `rspack.zcashUtility.ts`), and `__dirname` at runtime points to that
 * directory -- so a single resolution works for both.
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

/**
 * Resolves a one-shot resolver, logging a warning if the reply arrived for a
 * requestId we no longer track (e.g. after a timeout or utility restart).
 */
function resolveOneShot<T>(
  resolver: OneShotResolver<T>,
  requestId: RequestId,
  value: T,
  label: string,
): void {
  if (!resolver.resolve(requestId, value)) {
    log(LOG_TYPE, `${label} for unknown requestId`, { requestId });
  }
}

/** Rejects a one-shot resolver, with the same unknown-requestId logging as {@link resolveOneShot}. */
function rejectOneShot<T>(
  resolver: OneShotResolver<T>,
  requestId: RequestId,
  message: string,
  label: string,
): void {
  if (!resolver.reject(requestId, new Error(message))) {
    log(LOG_TYPE, `${label} for unknown requestId`, { requestId });
  }
}

function handleStreamMessage(event: StreamEvent): void {
  const sync = state.pendingSyncs.get(event.requestId);
  if (!sync) {
    log(LOG_TYPE, "stream event for unknown requestId", {
      requestId: event.requestId,
      kind: event.kind,
    });
    return;
  }
  sendStreamEvent(sync.webContentsId, event);
  if (event.kind === "complete" || event.kind === "error") {
    state.pendingSyncs.delete(event.requestId);
  }
}

function handleUtilityMessage(msg: UtilityOutboundMessage): void {
  const {
    chainTip,
    blockHeight,
    buildTx,
    buildIronwoodTx,
    finalizeTx,
    broadcastTx,
    transactionDetails,
  } = state.resolvers;
  switch (msg.type) {
    case "chain-tip":
      return resolveOneShot(chainTip, msg.requestId, msg.height, "chain-tip reply");
    case "chain-tip-error":
      return rejectOneShot(chainTip, msg.requestId, msg.message, "chain-tip-error");
    case "block-height":
      return resolveOneShot(blockHeight, msg.requestId, msg.height, "block-height reply");
    case "block-height-error":
      return rejectOneShot(blockHeight, msg.requestId, msg.message, "block-height-error");
    case "stream":
      return handleStreamMessage(msg.event);
    case "build-transaction-result":
      return resolveOneShot(buildTx, msg.requestId, msg.result, "build-transaction-result");
    case "build-transaction-error":
      return rejectOneShot(buildTx, msg.requestId, msg.message, "build-transaction-error");
    case "build-ironwood-transaction-result":
      return resolveOneShot(
        buildIronwoodTx,
        msg.requestId,
        msg.result,
        "build-ironwood-transaction-result",
      );
    case "build-ironwood-transaction-error":
      return rejectOneShot(
        buildIronwoodTx,
        msg.requestId,
        msg.message,
        "build-ironwood-transaction-error",
      );
    case "finalize-transaction-result":
      return resolveOneShot(finalizeTx, msg.requestId, msg.result, "finalize-transaction-result");
    case "finalize-transaction-error":
      return rejectOneShot(finalizeTx, msg.requestId, msg.message, "finalize-transaction-error");
    case "broadcast-transaction-result":
      return resolveOneShot(broadcastTx, msg.requestId, msg.txid, "broadcast-transaction-result");
    case "broadcast-transaction-error":
      return rejectOneShot(broadcastTx, msg.requestId, msg.message, "broadcast-transaction-error");
    case "transaction-details-result":
      return resolveOneShot(
        transactionDetails,
        msg.requestId,
        msg.results,
        "transaction-details-result",
      );
    case "transaction-details-error":
      return rejectOneShot(
        transactionDetails,
        msg.requestId,
        msg.message,
        "transaction-details-error",
      );
    default: {
      const exhaustive: never = msg;
      log(LOG_TYPE, "unknown utility message", { msg: exhaustive });
    }
  }
}

function sendStreamEvent(webContentsId: number, event: StreamEvent): void {
  // Resolve webContents lazily -- it might have been destroyed (window closed)
  // between the request and the reply. `fromId` returns undefined in that case.
  const { webContents } = getElectron();
  const wc = webContents.fromId(webContentsId);
  if (!wc || wc.isDestroyed()) {
    log(LOG_TYPE, "dropping stream event -- webContents destroyed", {
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

  ipcMain.handle<FindBlockHeightArgs, number>(
    ZCASH_IPC.findBlockHeight,
    (_event, args): Promise<number> =>
      state.resolvers.blockHeight.register(args.requestId, () =>
        postToUtility({ type: "find-block-height", args }),
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
      // and the utility handles unknown ids gracefully. Don't `await` -- cancel
      // must not block the renderer for longer than a single IPC round-trip.
      if (!state.utility) return;
      try {
        await postToUtility({ type: "cancel-sync", args });
      } finally {
        state.pendingSyncs.delete(args.requestId);
      }
    },
  );

  ipcMain.handle<BuildTransactionArgs, BuildTransactionResult>(
    ZCASH_IPC.buildTransaction,
    (_event, args): Promise<BuildTransactionResult> =>
      state.resolvers.buildTx.register(args.requestId, () =>
        postToUtility({ type: "build-transaction", args }),
      ),
  );

  ipcMain.handle<BuildIronwoodTransactionArgs, BuildIronwoodTransactionResult>(
    ZCASH_IPC.buildIronwoodTransaction,
    (_event, args): Promise<BuildIronwoodTransactionResult> =>
      state.resolvers.buildIronwoodTx.register(args.requestId, () =>
        postToUtility({ type: "build-ironwood-transaction", args }),
      ),
  );

  ipcMain.handle<FinalizeTransactionArgs, FinalizeTransactionResult>(
    ZCASH_IPC.finalizeTransaction,
    (_event, args): Promise<FinalizeTransactionResult> =>
      state.resolvers.finalizeTx.register(args.requestId, () =>
        postToUtility({ type: "finalize-transaction", args }),
      ),
  );

  ipcMain.handle<BroadcastTransactionArgs, string>(
    ZCASH_IPC.broadcastTransaction,
    (_event, args): Promise<string> =>
      state.resolvers.broadcastTx.register(args.requestId, () =>
        postToUtility({ type: "broadcast-transaction", args }),
      ),
  );

  ipcMain.handle<TransactionDetailsArgs, TransactionDetailsResult[]>(
    ZCASH_IPC.transactionDetails,
    (_event, args): Promise<TransactionDetailsResult[]> =>
      state.resolvers.transactionDetails.register(args.requestId, () =>
        postToUtility({ type: "transaction-details", args }),
      ),
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
  log(LOG_TYPE, "cleanup -- killing zcash utility");
  failAllPending(new Error("zcash utility shutting down"));
  try {
    utility.kill();
  } catch (err) {
    log(LOG_TYPE, "cleanup -- utility.kill() threw", { err: String(err) });
  }
  state.utility = null;
  state.spawnReady = null;
}
