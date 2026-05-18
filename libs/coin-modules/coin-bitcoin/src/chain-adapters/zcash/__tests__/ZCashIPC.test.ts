/* eslint @typescript-eslint/consistent-type-assertions: 0 */
import type { Subscription } from "rxjs";
import type { ShieldedSyncResultRaw, SyncShieldedArgs } from "../types";
import type {
  StreamEvent,
  StartSyncArgs,
  GetChainTipArgs,
  FindBlockHeightArgs,
} from "../ipc/contract";
import { ZCASH_IPC } from "../ipc/contract";
import { createZCashIPCClient, type IpcRendererLike } from "../ZCashIPC";

// ── Suppress log output ─────────────────────────────────────────────────

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

// ── Constants ───────────────────────────────────────────────────────────

const GRPC_URL = "https://grpc.example.com";
const ZCASH_REQUEST_ID_PATTERN = /^zcash-/;

// ── Helpers ─────────────────────────────────────────────────────────────

function makeRawResult(overrides?: Partial<ShieldedSyncResultRaw>): ShieldedSyncResultRaw {
  return {
    processedBlocks: 100,
    remainingBlocks: 900,
    transactions: [],
    ...overrides,
  };
}

const validArgs: SyncShieldedArgs = {
  viewingKey: "zxviews1test",
  startBlockHeight: 100,
  maxBatchSize: 500,
};

function makeIpcRenderer(): IpcRendererLike & {
  invoke: jest.Mock;
  on: jest.Mock;
  removeListener: jest.Mock;
} {
  return {
    invoke: jest.fn<Promise<unknown>, [string, unknown]>().mockResolvedValue(undefined),
    on: jest.fn(),
    removeListener: jest.fn(),
  };
}

type MockDeps = {
  ipcRenderer: ReturnType<typeof makeIpcRenderer>;
  rehydrateSyncResult: jest.Mock;
  createSyncTimeEstimator: jest.Mock;
};

function makeDeps(ipc?: ReturnType<typeof makeIpcRenderer>): MockDeps {
  return {
    ipcRenderer: ipc ?? makeIpcRenderer(),
    rehydrateSyncResult: jest.fn(raw => ({ ...raw, __rehydrated: true })),
    createSyncTimeEstimator: jest.fn(() => (_processedBlocks: number) => ({
      hours: 0,
      minutes: 0,
    })),
  };
}

type IpcListener = (event: unknown, payload: unknown) => void;

function getStartPayload(ipc: ReturnType<typeof makeIpcRenderer>): StartSyncArgs {
  return ipc.invoke.mock.calls[0][1] as StartSyncArgs;
}

function getStreamListener(ipc: ReturnType<typeof makeIpcRenderer>): IpcListener {
  return ipc.on.mock.calls[0][1] as IpcListener;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe("createZCashIPCClient", () => {
  // -- Constructor --------------------------------------------------------

  describe("constructor", () => {
    it("sets grpcUrl and defaults network to mainnet", () => {
      const client = createZCashIPCClient(makeDeps(), { grpcUrl: GRPC_URL });
      expect(client.grpcUrl).toBe(GRPC_URL);
      expect(client.network).toBe("mainnet");
    });

    it("allows overriding network", () => {
      const client = createZCashIPCClient(makeDeps(), { grpcUrl: GRPC_URL, network: "testnet" });
      expect(client.network).toBe("testnet");
    });
  });

  // -- getChainTip --------------------------------------------------------

  describe("getChainTip", () => {
    it("invokes ipc with the correct channel and payload, returns the height", async () => {
      const ipc = makeIpcRenderer();
      ipc.invoke.mockResolvedValueOnce(12345);
      const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

      const result = await client.getChainTip();

      expect(result).toBe(12345);
      expect(ipc.invoke).toHaveBeenCalledTimes(1);
      const [channel, payload] = ipc.invoke.mock.calls[0];
      const typedPayload = payload as GetChainTipArgs;
      expect(channel).toBe(ZCASH_IPC.getChainTip);
      expect(typedPayload.grpcUrl).toBe(GRPC_URL);
      expect(typedPayload.requestId).toMatch(ZCASH_REQUEST_ID_PATTERN);
    });
  });

  // -- findBlockHeight ----------------------------------------------------

  describe("findBlockHeight", () => {
    it("invokes ipc with the correct channel, grpcUrl, and timestamp", async () => {
      const ipc = makeIpcRenderer();
      ipc.invoke.mockResolvedValueOnce(200_000);
      const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

      const result = await client.findBlockHeight(1609459200);

      expect(result).toBe(200_000);
      expect(ipc.invoke).toHaveBeenCalledTimes(1);
      const [channel, payload] = ipc.invoke.mock.calls[0];
      const typedPayload = payload as FindBlockHeightArgs;
      expect(channel).toBe(ZCASH_IPC.findBlockHeight);
      expect(typedPayload.grpcUrl).toBe(GRPC_URL);
      expect(typedPayload.timestamp).toBe(1609459200);
      expect(typedPayload.requestId).toMatch(ZCASH_REQUEST_ID_PATTERN);
    });
  });

  // -- estimatedSyncTime --------------------------------------------------

  describe("estimatedSyncTime", () => {
    it("returns an estimator function", async () => {
      const client = createZCashIPCClient(makeDeps(), { grpcUrl: GRPC_URL });
      const estimator = await client.estimatedSyncTime(1000);
      expect(typeof estimator).toBe("function");
    });

    it("estimator returns {hours: 0, minutes: 0} when processedBlocks <= 0", async () => {
      const client = createZCashIPCClient(makeDeps(), { grpcUrl: GRPC_URL });
      const estimator = await client.estimatedSyncTime(1000);
      expect(estimator(0)).toEqual({ hours: 0, minutes: 0 });
    });
  });

  // -- syncShielded -------------------------------------------------------

  describe("syncShielded", () => {
    // -- Validation errors ------------------------------------------------

    describe("validation", () => {
      it("errors immediately when startBlockHeight is negative", done => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        client.syncShielded({ ...validArgs, startBlockHeight: -1 }).subscribe({
          next: () => done.fail("should not emit"),
          error: (err: Error) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toContain("negative");
            expect(err.message).toContain("startBlockHeight");
            expect(ipc.invoke).not.toHaveBeenCalled();
            done();
          },
          complete: () => done.fail("should not complete"),
        });
      });

      it("errors immediately when maxBatchSize is zero", done => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        client.syncShielded({ ...validArgs, maxBatchSize: 0 }).subscribe({
          next: () => done.fail("should not emit"),
          error: (err: Error) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toContain("maxBatchSize");
            expect(ipc.invoke).not.toHaveBeenCalled();
            done();
          },
          complete: () => done.fail("should not complete"),
        });
      });

      it("errors immediately when maxBatchSize is negative", done => {
        const client = createZCashIPCClient(makeDeps(), { grpcUrl: GRPC_URL });

        client.syncShielded({ ...validArgs, maxBatchSize: -5 }).subscribe({
          next: () => done.fail("should not emit"),
          error: (err: Error) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toContain("maxBatchSize");
            done();
          },
          complete: () => done.fail("should not complete"),
        });
      });
    });

    // -- Happy path -------------------------------------------------------

    describe("happy path", () => {
      it("registers a listener on the stream channel and invokes startSync", () => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        client.syncShielded(validArgs).subscribe({ next: jest.fn() });

        expect(ipc.on).toHaveBeenCalledTimes(1);
        expect(ipc.on).toHaveBeenCalledWith(ZCASH_IPC.stream, expect.any(Function));

        expect(ipc.invoke).toHaveBeenCalledTimes(1);
        const [channel, payload] = ipc.invoke.mock.calls[0];
        const typedPayload = payload as StartSyncArgs;
        expect(channel).toBe(ZCASH_IPC.startSync);
        expect(typedPayload.grpcUrl).toBe(GRPC_URL);
        expect(typedPayload.network).toBe("mainnet");
        expect(typedPayload.viewingKey).toBe(validArgs.viewingKey);
        expect(typedPayload.startBlockHeight).toBe(validArgs.startBlockHeight);
        expect(typedPayload.maxBatchSize).toBe(validArgs.maxBatchSize);
        expect(typedPayload.requestId).toMatch(ZCASH_REQUEST_ID_PATTERN);
      });

      it("emits rehydrated chunk results", () => {
        const ipc = makeIpcRenderer();
        const deps = makeDeps(ipc);
        const client = createZCashIPCClient(deps, { grpcUrl: GRPC_URL });

        const received: unknown[] = [];
        client.syncShielded(validArgs).subscribe({ next: v => received.push(v) });

        const { requestId } = getStartPayload(ipc);
        const listener = getStreamListener(ipc);

        const rawResult = makeRawResult();
        const chunkEvent: StreamEvent = { kind: "chunk", requestId, result: rawResult };
        listener(null, chunkEvent);

        expect(deps.rehydrateSyncResult).toHaveBeenCalledTimes(1);
        expect(deps.rehydrateSyncResult).toHaveBeenCalledWith(rawResult);
        expect(received).toHaveLength(1);
        expect(received[0]).toEqual(expect.objectContaining({ __rehydrated: true }));
      });
    });

    // -- Completion -------------------------------------------------------

    describe("completion", () => {
      it("completes the subscriber on a complete event", done => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        client.syncShielded(validArgs).subscribe({
          next: jest.fn(),
          error: () => done.fail("should not error"),
          complete: () => done(),
        });

        const { requestId } = getStartPayload(ipc);
        const listener = getStreamListener(ipc);

        const completeEvent: StreamEvent = { kind: "complete", requestId };
        listener(null, completeEvent);
      });
    });

    // -- Error from stream ------------------------------------------------

    describe("stream error", () => {
      it("errors the subscriber on an error event", done => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        client.syncShielded(validArgs).subscribe({
          next: jest.fn(),
          error: (err: Error) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("sync engine crash");
            done();
          },
          complete: () => done.fail("should not complete"),
        });

        const { requestId } = getStartPayload(ipc);
        const listener = getStreamListener(ipc);

        const errorEvent: StreamEvent = { kind: "error", requestId, message: "sync engine crash" };
        listener(null, errorEvent);
      });
    });

    // -- startSync invoke rejection ---------------------------------------

    describe("startSync invoke rejection", () => {
      it("errors the subscriber if ipc.invoke rejects with an Error", done => {
        const ipc = makeIpcRenderer();
        const invokeError = new Error("ipc broken");
        ipc.invoke.mockRejectedValue(invokeError);
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        client.syncShielded(validArgs).subscribe({
          next: jest.fn(),
          error: (err: Error) => {
            expect(err).toBe(invokeError);
            done();
          },
          complete: () => done.fail("should not complete"),
        });
      });

      it("wraps non-Error rejections in an Error", done => {
        const ipc = makeIpcRenderer();
        ipc.invoke.mockRejectedValue("string rejection");
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        client.syncShielded(validArgs).subscribe({
          next: jest.fn(),
          error: (err: Error) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("string rejection");
            done();
          },
          complete: () => done.fail("should not complete"),
        });
      });
    });

    // -- Request ID filtering ---------------------------------------------

    describe("request ID filtering", () => {
      it("ignores events with a different requestId", () => {
        const ipc = makeIpcRenderer();
        const deps = makeDeps(ipc);
        const client = createZCashIPCClient(deps, { grpcUrl: GRPC_URL });

        const received: unknown[] = [];
        client.syncShielded(validArgs).subscribe({ next: v => received.push(v) });

        const listener = getStreamListener(ipc);

        const wrongEvent: StreamEvent = {
          kind: "chunk",
          requestId: "wrong-id-123",
          result: makeRawResult(),
        };
        listener(null, wrongEvent);

        expect(received).toHaveLength(0);
        expect(deps.rehydrateSyncResult).not.toHaveBeenCalled();
      });

      it("ignores null/undefined payloads", () => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        const received: unknown[] = [];
        const errors: unknown[] = [];
        client.syncShielded(validArgs).subscribe({
          next: v => received.push(v),
          error: e => errors.push(e),
        });

        const listener = getStreamListener(ipc);
        listener(null, null);
        listener(null, undefined);

        expect(received).toHaveLength(0);
        expect(errors).toHaveLength(0);
      });
    });

    // -- Teardown ---------------------------------------------------------

    describe("teardown", () => {
      it("removes the listener and invokes cancelSync on unsubscribe", () => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        const sub: Subscription = client.syncShielded(validArgs).subscribe({ next: jest.fn() });

        const { requestId } = getStartPayload(ipc);
        const listener = getStreamListener(ipc);

        ipc.invoke.mockClear();
        ipc.invoke.mockResolvedValue(undefined);

        sub.unsubscribe();

        expect(ipc.removeListener).toHaveBeenCalledTimes(1);
        expect(ipc.removeListener).toHaveBeenCalledWith(ZCASH_IPC.stream, listener);

        expect(ipc.invoke).toHaveBeenCalledTimes(1);
        const [channel, payload] = ipc.invoke.mock.calls[0];
        expect(channel).toBe(ZCASH_IPC.cancelSync);
        expect(payload).toEqual({ requestId });
      });

      it("does not throw if cancelSync invoke fails", () => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        const sub = client.syncShielded(validArgs).subscribe({ next: jest.fn() });

        ipc.invoke.mockClear();
        ipc.invoke.mockRejectedValue(new Error("cancel failed"));

        expect(() => sub.unsubscribe()).not.toThrow();
      });
    });

    // -- Unknown event kind (default branch) ------------------------------

    describe("unknown event kind", () => {
      it("logs and does not emit or error for unknown event kinds", () => {
        const ipc = makeIpcRenderer();
        const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

        const received: unknown[] = [];
        const errors: unknown[] = [];
        client.syncShielded(validArgs).subscribe({
          next: v => received.push(v),
          error: e => errors.push(e),
        });

        const { requestId } = getStartPayload(ipc);
        const listener = getStreamListener(ipc);

        const unknownEvent = { kind: "unknown-kind", requestId } as unknown as StreamEvent;
        listener(null, unknownEvent);

        expect(received).toHaveLength(0);
        expect(errors).toHaveLength(0);
      });
    });
  });

  // -- Unique request IDs ------------------------------------------------

  describe("request ID uniqueness", () => {
    it("generates unique requestIds across multiple calls", async () => {
      const ipc = makeIpcRenderer();
      ipc.invoke.mockResolvedValue(42);
      const client = createZCashIPCClient(makeDeps(ipc), { grpcUrl: GRPC_URL });

      await client.getChainTip();
      await client.getChainTip();

      const id1 = (ipc.invoke.mock.calls[0][1] as GetChainTipArgs).requestId;
      const id2 = (ipc.invoke.mock.calls[1][1] as GetChainTipArgs).requestId;

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(ZCASH_REQUEST_ID_PATTERN);
      expect(id2).toMatch(ZCASH_REQUEST_ID_PATTERN);
    });
  });
});
