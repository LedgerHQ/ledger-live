/* eslint @typescript-eslint/consistent-type-assertions: 0 */
import { ZCASH_IPC } from "../contract";
import type { UtilityInboundMessage, UtilityOutboundMessage } from "../contract";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

// A stateful, virtual Electron mock. `main-host.ts` lazily `require("electron")`
// so this virtual module is what `getElectron()` resolves. Everything is kept
// on `mockRegistry` so tests can drive the event handlers the host registers.
type AnyFn = (...args: unknown[]) => void;

const mockRegistry: {
  handlers: Map<string, (event: { sender: { id: number } }, args: unknown) => unknown>;
  once: Record<string, AnyFn[]>;
  on: Record<string, AnyFn[]>;
  posted: UtilityInboundMessage[];
  sent: Array<{ id: number; channel: string; payload: unknown }>;
  killed: number;
  beforeQuit: (() => void) | undefined;
  wcDestroyed: boolean;
  fromIdReturnsNull: boolean;
  killThrows: boolean;
  stdout: AnyFn[];
  stderr: AnyFn[];
} = {
  handlers: new Map(),
  once: {},
  on: {},
  posted: [],
  sent: [],
  killed: 0,
  beforeQuit: undefined,
  wcDestroyed: false,
  fromIdReturnsNull: false,
  killThrows: false,
  stdout: [],
  stderr: [],
};

const mockElectron = {
  app: {
    on: (event: string, cb: () => void) => {
      if (event === "before-quit") mockRegistry.beforeQuit = cb;
    },
  },
  ipcMain: {
    handle: (
      channel: string,
      listener: (event: { sender: { id: number } }, args: unknown) => unknown,
    ) => {
      mockRegistry.handlers.set(channel, listener);
    },
  },
  utilityProcess: {
    fork: () => ({
      stdout: {
        on: (_e: string, cb: AnyFn) => {
          mockRegistry.stdout.push(cb);
        },
      },
      stderr: {
        on: (_e: string, cb: AnyFn) => {
          mockRegistry.stderr.push(cb);
        },
      },
      once: (event: string, cb: AnyFn) => {
        (mockRegistry.once[event] ||= []).push(cb);
      },
      on: (event: string, cb: AnyFn) => {
        (mockRegistry.on[event] ||= []).push(cb);
      },
      postMessage: (msg: UtilityInboundMessage) => {
        mockRegistry.posted.push(msg);
      },
      kill: () => {
        mockRegistry.killed++;
        if (mockRegistry.killThrows) throw new Error("kill boom");
      },
    }),
  },
  webContents: {
    fromId: (id: number) =>
      mockRegistry.fromIdReturnsNull
        ? null
        : {
            send: (channel: string, payload: unknown) =>
              mockRegistry.sent.push({ id, channel, payload }),
            isDestroyed: () => mockRegistry.wcDestroyed,
          },
  },
};

jest.mock("electron", () => mockElectron, { virtual: true });

import { setupZcashNativeHost, cleanupZcashNativeHost } from "../main-host";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const flush = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

/** Fire the utility's captured `spawn` event so `spawnReady` resolves. */
const emitSpawn = (): void => (mockRegistry.once.spawn ?? []).forEach(cb => cb());
/** Fire the utility's captured `exit` events (both once + on listeners). */
const emitExit = (code: number): void => {
  (mockRegistry.once.exit ?? []).forEach(cb => cb(code));
  (mockRegistry.on.exit ?? []).forEach(cb => cb(code));
};
/** Fire only the spawn-phase `once("exit")` listener (utility died before spawning). */
const emitSpawnExit = (code: number): void =>
  (mockRegistry.once.exit ?? []).forEach(cb => cb(code));
/** Simulate a message coming back from the utility to the host. */
const emitUtilityMessage = (msg: UtilityOutboundMessage): void =>
  (mockRegistry.on.message ?? []).forEach(cb => cb(msg));

const getHandler = (channel: string) => {
  const handler = mockRegistry.handlers.get(channel);
  if (!handler) throw new Error(`no handler registered for ${channel}`);
  return handler;
};

/**
 * Invokes a handler we don't intend to await. Swallows the rejection that
 * `failAllPending` produces when the utility exits or cleanup runs, so those
 * expected rejections don't surface as unhandled promise rejections.
 */
const fireAndForget = (channel: string, args: unknown, id = 1): void => {
  Promise.resolve(getHandler(channel)(event(id), args)).catch(() => {});
};

const event = (id = 1) => ({ sender: { id } });

beforeEach(() => {
  // Reset internal host state (kills any lingering utility) and mock captures.
  cleanupZcashNativeHost();
  mockRegistry.handlers.clear();
  mockRegistry.once = {};
  mockRegistry.on = {};
  mockRegistry.posted = [];
  mockRegistry.sent = [];
  mockRegistry.killed = 0;
  mockRegistry.beforeQuit = undefined;
  mockRegistry.wcDestroyed = false;
  mockRegistry.fromIdReturnsNull = false;
  mockRegistry.killThrows = false;
  mockRegistry.stdout = [];
  mockRegistry.stderr = [];
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("setupZcashNativeHost", () => {
  it("registers all IPC handlers and a before-quit hook", () => {
    setupZcashNativeHost();

    expect([...mockRegistry.handlers.keys()].sort()).toEqual(
      [
        ZCASH_IPC.getChainTip,
        ZCASH_IPC.findBlockHeight,
        ZCASH_IPC.startSync,
        ZCASH_IPC.cancelSync,
        ZCASH_IPC.buildTransaction,
        ZCASH_IPC.finalizeTransaction,
        ZCASH_IPC.broadcastTransaction,
        ZCASH_IPC.transactionDetails,
      ].sort(),
    );
    expect(typeof mockRegistry.beforeQuit).toBe("function");
  });
});

describe("one-shot transaction handlers", () => {
  const buildArgs = {
    requestId: "req-build",
    grpcUrl: "https://grpc.example.com",
    ufvk: "uview1test",
    seedFingerprint: "00",
    accountIndex: 0,
    feeZat: "10000",
    spends: [],
    transparentInputs: [],
    outputs: [{ address: "u1recipient", valueZat: "50000" }],
  };

  it("buildTransaction forwards the request to the utility and resolves on its reply", async () => {
    setupZcashNativeHost();
    const handler = getHandler(ZCASH_IPC.buildTransaction);

    const promise = handler(event(), buildArgs) as Promise<unknown>;
    emitSpawn();
    await flush();

    expect(mockRegistry.posted).toContainEqual({ type: "build-transaction", args: buildArgs });

    const result = { pcztHex: "deadbeef" };
    emitUtilityMessage({
      type: "build-transaction-result",
      requestId: "req-build",
      result: result as never,
    });

    await expect(promise).resolves.toEqual(result);
  });

  it("buildTransaction rejects when the utility replies with an error", async () => {
    setupZcashNativeHost();
    const handler = getHandler(ZCASH_IPC.buildTransaction);

    const promise = handler(event(), buildArgs) as Promise<unknown>;
    emitSpawn();
    await flush();

    emitUtilityMessage({
      type: "build-transaction-error",
      requestId: "req-build",
      message: "proving failed",
    });

    await expect(promise).rejects.toThrow("proving failed");
  });

  it("finalizeTransaction forwards and resolves on the utility reply", async () => {
    setupZcashNativeHost();
    const args = {
      requestId: "req-final",
      pczt: "cafebabe",
      orchardSignatures: [],
      transparentSignatures: [],
    };
    const promise = getHandler(ZCASH_IPC.finalizeTransaction)(event(), args) as Promise<unknown>;
    emitSpawn();
    await flush();

    expect(mockRegistry.posted).toContainEqual({ type: "finalize-transaction", args });

    const result = { txHex: "ff00", txid: "cc" };
    emitUtilityMessage({
      type: "finalize-transaction-result",
      requestId: "req-final",
      result: result as never,
    });
    await expect(promise).resolves.toEqual(result);
  });

  it("finalizeTransaction rejects on a utility error reply", async () => {
    setupZcashNativeHost();
    const args = {
      requestId: "req-final",
      pczt: "cafebabe",
      orchardSignatures: [],
      transparentSignatures: [],
    };
    const promise = getHandler(ZCASH_IPC.finalizeTransaction)(event(), args) as Promise<unknown>;
    emitSpawn();
    await flush();

    emitUtilityMessage({
      type: "finalize-transaction-error",
      requestId: "req-final",
      message: "bad sig",
    });
    await expect(promise).rejects.toThrow("bad sig");
  });

  it("broadcastTransaction forwards and resolves with the txid", async () => {
    setupZcashNativeHost();
    const args = { requestId: "req-cast", grpcUrl: "u", txHex: "abcd" };
    const promise = getHandler(ZCASH_IPC.broadcastTransaction)(event(), args) as Promise<unknown>;
    emitSpawn();
    await flush();

    expect(mockRegistry.posted).toContainEqual({ type: "broadcast-transaction", args });

    emitUtilityMessage({
      type: "broadcast-transaction-result",
      requestId: "req-cast",
      txid: "dd",
    });
    await expect(promise).resolves.toBe("dd");
  });

  it("transactionDetails forwards and resolves with the fees, in request order", async () => {
    setupZcashNativeHost();
    const args = {
      requestId: "req-fees",
      grpcUrl: "u",
      network: "mainnet",
      requests: [{ txid: "aa", height: 3_426_175, prevouts: [] }],
    };
    const promise = getHandler(ZCASH_IPC.transactionDetails)(event(), args) as Promise<unknown>;
    emitSpawn();
    await flush();

    expect(mockRegistry.posted).toContainEqual({ type: "transaction-details", args });

    const results = [{ txid: "aa", fee: "55000", payees: ["u1payee"] }];
    emitUtilityMessage({ type: "transaction-details-result", requestId: "req-fees", results });
    await expect(promise).resolves.toEqual(results);
  });

  it("transactionDetails rejects on a utility error reply", async () => {
    setupZcashNativeHost();
    const args = { requestId: "req-fees", grpcUrl: "u", network: "mainnet", requests: [] };
    const promise = getHandler(ZCASH_IPC.transactionDetails)(event(), args) as Promise<unknown>;
    emitSpawn();
    await flush();

    emitUtilityMessage({
      type: "transaction-details-error",
      requestId: "req-fees",
      message: "gRPC unreachable",
    });
    await expect(promise).rejects.toThrow("gRPC unreachable");
  });

  it("broadcastTransaction rejects on a utility error reply", async () => {
    setupZcashNativeHost();
    const args = { requestId: "req-cast", grpcUrl: "u", txHex: "abcd" };
    const promise = getHandler(ZCASH_IPC.broadcastTransaction)(event(), args) as Promise<unknown>;
    emitSpawn();
    await flush();

    emitUtilityMessage({
      type: "broadcast-transaction-error",
      requestId: "req-cast",
      message: "gRPC rejected",
    });
    await expect(promise).rejects.toThrow("gRPC rejected");
  });

  it("getChainTip and findBlockHeight resolve via the utility replies", async () => {
    setupZcashNativeHost();

    const tipPromise = getHandler(ZCASH_IPC.getChainTip)(event(), {
      requestId: "c1",
      grpcUrl: "u",
    }) as Promise<number>;
    emitSpawn();
    await flush();
    emitUtilityMessage({ type: "chain-tip", requestId: "c1", height: 42 });
    await expect(tipPromise).resolves.toBe(42);

    const heightPromise = getHandler(ZCASH_IPC.findBlockHeight)(event(), {
      requestId: "b1",
      grpcUrl: "u",
      timestamp: 1,
    }) as Promise<number>;
    await flush();
    emitUtilityMessage({ type: "block-height", requestId: "b1", height: 777 });
    await expect(heightPromise).resolves.toBe(777);
  });

  it("rejects chain-tip/block-height requests on error replies", async () => {
    setupZcashNativeHost();

    const tipPromise = getHandler(ZCASH_IPC.getChainTip)(event(), {
      requestId: "c1",
      grpcUrl: "u",
    }) as Promise<number>;
    emitSpawn();
    await flush();
    emitUtilityMessage({ type: "chain-tip-error", requestId: "c1", message: "no tip" });
    await expect(tipPromise).rejects.toThrow("no tip");

    const heightPromise = getHandler(ZCASH_IPC.findBlockHeight)(event(), {
      requestId: "b1",
      grpcUrl: "u",
      timestamp: 1,
    }) as Promise<number>;
    await flush();
    emitUtilityMessage({ type: "block-height-error", requestId: "b1", message: "no height" });
    await expect(heightPromise).rejects.toThrow("no height");
  });

  it("drops utility replies for unknown requestIds without throwing", async () => {
    setupZcashNativeHost();
    // Spawn a utility so a message listener exists.
    const promise = getHandler(ZCASH_IPC.getChainTip)(event(), {
      requestId: "known",
      grpcUrl: "u",
    }) as Promise<number>;
    emitSpawn();
    await flush();

    expect(() =>
      emitUtilityMessage({ type: "chain-tip", requestId: "unknown-id", height: 1 }),
    ).not.toThrow();

    // The known request is still pending and unaffected.
    emitUtilityMessage({ type: "chain-tip", requestId: "known", height: 5 });
    await expect(promise).resolves.toBe(5);
  });

  it("logs and ignores an unknown utility message type", async () => {
    setupZcashNativeHost();
    fireAndForget(ZCASH_IPC.getChainTip, { requestId: "c1", grpcUrl: "u" });
    emitSpawn();
    await flush();

    expect(() =>
      emitUtilityMessage({ type: "totally-unknown" } as unknown as UtilityOutboundMessage),
    ).not.toThrow();
  });

  it("logs but does not throw when an error reply targets an unknown requestId", async () => {
    setupZcashNativeHost();
    fireAndForget(ZCASH_IPC.getChainTip, { requestId: "c1", grpcUrl: "u" });
    emitSpawn();
    await flush();

    expect(() =>
      emitUtilityMessage({ type: "chain-tip-error", requestId: "ghost", message: "boom" }),
    ).not.toThrow();
  });

  it("logs the utility stdout/stderr output", async () => {
    setupZcashNativeHost();
    fireAndForget(ZCASH_IPC.getChainTip, { requestId: "c1", grpcUrl: "u" });
    emitSpawn();
    await flush();

    expect(mockRegistry.stdout).toHaveLength(1);
    expect(mockRegistry.stderr).toHaveLength(1);
    expect(() => mockRegistry.stdout[0](Buffer.from("hello"))).not.toThrow();
    expect(() => mockRegistry.stderr[0](Buffer.from("oops"))).not.toThrow();
  });
});

describe("start-sync and stream routing", () => {
  const startArgs = {
    requestId: "s1",
    grpcUrl: "u",
    network: "mainnet",
    viewingKey: "vk",
    startBlockHeight: 0,
    maxBatchSize: 100,
  };

  async function startSync(id = 9): Promise<void> {
    setupZcashNativeHost();
    const promise = getHandler(ZCASH_IPC.startSync)(event(id), startArgs) as Promise<void>;
    emitSpawn();
    await flush();
    await promise;
  }

  it("posts the start-sync message to the utility", async () => {
    await startSync();
    expect(mockRegistry.posted).toContainEqual({ type: "start-sync", args: startArgs });
  });

  it("routes stream chunk events back to the originating webContents", async () => {
    await startSync(9);

    const streamEvent = {
      requestId: "s1",
      kind: "chunk" as const,
      result: { processedBlocks: 1, remainingBlocks: 0, transactions: [] },
    };
    emitUtilityMessage({ type: "stream", event: streamEvent });

    expect(mockRegistry.sent).toEqual([{ id: 9, channel: ZCASH_IPC.stream, payload: streamEvent }]);
  });

  it("stops routing after a complete event (pending sync removed)", async () => {
    await startSync(9);

    emitUtilityMessage({ type: "stream", event: { requestId: "s1", kind: "complete" } });
    expect(mockRegistry.sent).toHaveLength(1); // the complete event forwarded once

    // A late event for the now-removed sync is dropped.
    emitUtilityMessage({
      type: "stream",
      event: { requestId: "s1", kind: "chunk", result: {} as never },
    });
    expect(mockRegistry.sent).toHaveLength(1);
  });

  it("drops stream events for unknown requestIds", async () => {
    await startSync(9);
    emitUtilityMessage({
      type: "stream",
      event: { requestId: "other", kind: "complete" },
    });
    expect(mockRegistry.sent).toHaveLength(0);
  });

  it("drops stream events when the target webContents was destroyed", async () => {
    await startSync(9);
    mockRegistry.wcDestroyed = true;
    emitUtilityMessage({
      type: "stream",
      event: { requestId: "s1", kind: "chunk", result: {} as never },
    });
    expect(mockRegistry.sent).toHaveLength(0);
  });

  it("drops stream events when the webContents no longer exists", async () => {
    await startSync(9);
    mockRegistry.fromIdReturnsNull = true;
    emitUtilityMessage({
      type: "stream",
      event: { requestId: "s1", kind: "chunk", result: {} as never },
    });
    expect(mockRegistry.sent).toHaveLength(0);
  });

  it("cancelSync posts a cancel message when a utility is running", async () => {
    await startSync(9);
    mockRegistry.posted = [];

    await getHandler(ZCASH_IPC.cancelSync)(event(), { requestId: "s1" });
    expect(mockRegistry.posted).toContainEqual({ type: "cancel-sync", args: { requestId: "s1" } });
  });

  it("cancelSync is a no-op when no utility has been spawned", async () => {
    setupZcashNativeHost();
    await getHandler(ZCASH_IPC.cancelSync)(event(), { requestId: "s1" });
    expect(mockRegistry.posted).toHaveLength(0);
  });
});

describe("utility lifecycle", () => {
  const buildArgs = {
    requestId: "req-build",
    grpcUrl: "u",
    ufvk: "x",
    seedFingerprint: "00",
    accountIndex: 0,
    feeZat: "1",
    spends: [],
    transparentInputs: [],
    outputs: [],
  };

  it("fails all in-flight one-shot requests when the utility exits", async () => {
    setupZcashNativeHost();
    const promise = getHandler(ZCASH_IPC.buildTransaction)(event(), buildArgs) as Promise<unknown>;
    emitSpawn();
    await flush();

    emitExit(9);

    await expect(promise).rejects.toThrow("zcash utility exited (code 9)");
  });

  it("fails in-flight syncs with a stream error when the utility exits", async () => {
    setupZcashNativeHost();
    const promise = getHandler(ZCASH_IPC.startSync)(event(3), {
      requestId: "s1",
      grpcUrl: "u",
      network: "mainnet",
      viewingKey: "vk",
      startBlockHeight: 0,
      maxBatchSize: 100,
    }) as Promise<void>;
    emitSpawn();
    await flush();
    await promise;
    mockRegistry.sent = [];

    emitExit(2);

    expect(mockRegistry.sent).toEqual([
      {
        id: 3,
        channel: ZCASH_IPC.stream,
        payload: { requestId: "s1", kind: "error", message: "zcash utility exited (code 2)" },
      },
    ]);
  });

  it("reuses the same utility across requests (forks only once)", async () => {
    setupZcashNativeHost();
    fireAndForget(ZCASH_IPC.getChainTip, { requestId: "c1", grpcUrl: "u" });
    emitSpawn();
    await flush();

    // A second request must reuse the running utility (no new spawn listeners).
    const spawnListenersAfterFirst = (mockRegistry.once.spawn ?? []).length;
    fireAndForget(ZCASH_IPC.getChainTip, { requestId: "c2", grpcUrl: "u" });
    await flush();

    expect((mockRegistry.once.spawn ?? []).length).toBe(spawnListenersAfterFirst);
  });

  it("cleanup kills the running utility and is idempotent", async () => {
    setupZcashNativeHost();
    fireAndForget(ZCASH_IPC.getChainTip, { requestId: "c1", grpcUrl: "u" });
    emitSpawn();
    await flush();

    cleanupZcashNativeHost();
    expect(mockRegistry.killed).toBe(1);

    // No utility left -> second cleanup is a no-op.
    cleanupZcashNativeHost();
    expect(mockRegistry.killed).toBe(1);
  });

  it("swallows errors thrown by utility.kill() during cleanup", async () => {
    setupZcashNativeHost();
    fireAndForget(ZCASH_IPC.getChainTip, { requestId: "c1", grpcUrl: "u" });
    emitSpawn();
    await flush();

    mockRegistry.killThrows = true;
    expect(() => cleanupZcashNativeHost()).not.toThrow();
    expect(mockRegistry.killed).toBe(1);
  });

  it("before-quit hook triggers cleanup", async () => {
    setupZcashNativeHost();
    fireAndForget(ZCASH_IPC.getChainTip, { requestId: "c1", grpcUrl: "u" });
    emitSpawn();
    await flush();

    mockRegistry.beforeQuit!();
    expect(mockRegistry.killed).toBe(1);
  });

  it("rejects when the utility exits before spawning", async () => {
    setupZcashNativeHost();
    const promise = getHandler(ZCASH_IPC.getChainTip)(event(), {
      requestId: "c1",
      grpcUrl: "u",
    }) as Promise<number>;

    // Exit fires before spawn -> spawnReady rejects -> handler rejects.
    emitSpawnExit(1);

    await expect(promise).rejects.toThrow(/exited before spawn \(code 1\)/);
  });
});
