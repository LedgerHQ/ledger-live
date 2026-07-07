/* eslint @typescript-eslint/consistent-type-assertions: 0 */
import type { UtilityInboundMessage, UtilityOutboundMessage } from "../contract";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

const mockGetChainTipJob = jest.fn();
const mockFindBlockHeightJob = jest.fn();
const mockStartSyncJob = jest.fn();
const mockBuildTransactionJob = jest.fn();
const mockFinalizeTransactionJob = jest.fn();
const mockBroadcastTransactionJob = jest.fn();

jest.mock("../../native-engine/engine", () => ({
  getChainTipJob: (...args: unknown[]) => mockGetChainTipJob(...args),
  findBlockHeightJob: (...args: unknown[]) => mockFindBlockHeightJob(...args),
  startSyncJob: (...args: unknown[]) => mockStartSyncJob(...args),
  buildTransactionJob: (...args: unknown[]) => mockBuildTransactionJob(...args),
  finalizeTransactionJob: (...args: unknown[]) => mockFinalizeTransactionJob(...args),
  broadcastTransactionJob: (...args: unknown[]) => mockBroadcastTransactionJob(...args),
}));

import { bootstrapUtility } from "../utility-entry";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const flush = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

type MessageHandler = (event: { data: UtilityInboundMessage }) => void;

function makePort() {
  let handler: MessageHandler | undefined;
  const posted: UtilityOutboundMessage[] = [];
  const port = {
    on: (_event: "message", h: MessageHandler) => {
      handler = h;
    },
    postMessage: (message: UtilityOutboundMessage) => {
      posted.push(message);
    },
  };
  bootstrapUtility(port);
  return {
    posted,
    dispatch: (message: UtilityInboundMessage) => handler!({ data: message }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("bootstrapUtility — build-transaction", () => {
  const args = {
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

  it("runs buildTransactionJob (without requestId) and posts the result", async () => {
    const result = { pcztHex: "deadbeef" };
    mockBuildTransactionJob.mockResolvedValue(result);

    const { posted, dispatch } = makePort();
    dispatch({ type: "build-transaction", args });
    await flush();

    const { requestId, ...jobArgs } = args;
    expect(mockBuildTransactionJob).toHaveBeenCalledWith(jobArgs);
    expect(posted).toEqual([{ type: "build-transaction-result", requestId: "req-build", result }]);
  });

  it("posts a build-transaction-error with the Error message on failure", async () => {
    mockBuildTransactionJob.mockRejectedValue(new Error("proving failed"));

    const { posted, dispatch } = makePort();
    dispatch({ type: "build-transaction", args });
    await flush();

    expect(posted).toEqual([
      { type: "build-transaction-error", requestId: "req-build", message: "proving failed" },
    ]);
  });

  it("stringifies non-Error rejections", async () => {
    mockBuildTransactionJob.mockRejectedValue("boom");

    const { posted, dispatch } = makePort();
    dispatch({ type: "build-transaction", args });
    await flush();

    expect(posted).toEqual([
      { type: "build-transaction-error", requestId: "req-build", message: "boom" },
    ]);
  });
});

describe("bootstrapUtility — finalize-transaction", () => {
  const args = {
    requestId: "req-final",
    pczt: "cafebabe",
    orchardSignatures: ["aa"],
    transparentSignatures: ["bb"],
  };

  it("runs finalizeTransactionJob (without requestId) and posts the result", async () => {
    const result = { txHex: "ff00", txid: "cc" };
    mockFinalizeTransactionJob.mockResolvedValue(result);

    const { posted, dispatch } = makePort();
    dispatch({ type: "finalize-transaction", args });
    await flush();

    const { requestId, ...jobArgs } = args;
    expect(mockFinalizeTransactionJob).toHaveBeenCalledWith(jobArgs);
    expect(posted).toEqual([
      { type: "finalize-transaction-result", requestId: "req-final", result },
    ]);
  });

  it("posts a finalize-transaction-error on failure", async () => {
    mockFinalizeTransactionJob.mockRejectedValue(new Error("bad signature"));

    const { posted, dispatch } = makePort();
    dispatch({ type: "finalize-transaction", args });
    await flush();

    expect(posted).toEqual([
      { type: "finalize-transaction-error", requestId: "req-final", message: "bad signature" },
    ]);
  });
});

describe("bootstrapUtility — broadcast-transaction", () => {
  const args = { requestId: "req-cast", grpcUrl: "https://grpc.example.com", txHex: "abcd" };

  it("runs broadcastTransactionJob and posts the txid", async () => {
    mockBroadcastTransactionJob.mockResolvedValue("dd");

    const { posted, dispatch } = makePort();
    dispatch({ type: "broadcast-transaction", args });
    await flush();

    expect(mockBroadcastTransactionJob).toHaveBeenCalledWith("https://grpc.example.com", "abcd");
    expect(posted).toEqual([
      { type: "broadcast-transaction-result", requestId: "req-cast", txid: "dd" },
    ]);
  });

  it("posts a broadcast-transaction-error on failure", async () => {
    mockBroadcastTransactionJob.mockRejectedValue(new Error("gRPC rejected"));

    const { posted, dispatch } = makePort();
    dispatch({ type: "broadcast-transaction", args });
    await flush();

    expect(posted).toEqual([
      { type: "broadcast-transaction-error", requestId: "req-cast", message: "gRPC rejected" },
    ]);
  });
});

describe("bootstrapUtility — existing sync/chain handlers", () => {
  it("handles get-chain-tip", async () => {
    mockGetChainTipJob.mockResolvedValue(1_000_000);
    const { posted, dispatch } = makePort();
    dispatch({ type: "get-chain-tip", args: { requestId: "c1", grpcUrl: "u" } });
    await flush();
    expect(posted).toEqual([{ type: "chain-tip", requestId: "c1", height: 1_000_000 }]);
  });

  it("posts chain-tip-error on failure", async () => {
    mockGetChainTipJob.mockRejectedValue(new Error("gRPC down"));
    const { posted, dispatch } = makePort();
    dispatch({ type: "get-chain-tip", args: { requestId: "c1", grpcUrl: "u" } });
    await flush();
    expect(posted).toEqual([{ type: "chain-tip-error", requestId: "c1", message: "gRPC down" }]);
  });

  it("handles find-block-height", async () => {
    mockFindBlockHeightJob.mockResolvedValue(800_000);
    const { posted, dispatch } = makePort();
    dispatch({ type: "find-block-height", args: { requestId: "b1", grpcUrl: "u", timestamp: 1 } });
    await flush();
    expect(posted).toEqual([{ type: "block-height", requestId: "b1", height: 800_000 }]);
  });

  it("posts block-height-error on failure", async () => {
    mockFindBlockHeightJob.mockRejectedValue("weird");
    const { posted, dispatch } = makePort();
    dispatch({ type: "find-block-height", args: { requestId: "b1", grpcUrl: "u", timestamp: 1 } });
    await flush();
    expect(posted).toEqual([{ type: "block-height-error", requestId: "b1", message: "weird" }]);
  });

  it("streams chunks then a complete event for start-sync", async () => {
    mockStartSyncJob.mockImplementation(
      async (_args: unknown, onChunk: (c: unknown) => void) => {
        onChunk({ processedBlocks: 10, remainingBlocks: 0, transactions: [] });
      },
    );
    const { posted, dispatch } = makePort();
    dispatch({
      type: "start-sync",
      args: {
        requestId: "s1",
        grpcUrl: "u",
        network: "mainnet",
        viewingKey: "vk",
        startBlockHeight: 0,
        maxBatchSize: 100,
      },
    });
    await flush();

    expect(posted[0]).toEqual({
      type: "stream",
      event: {
        requestId: "s1",
        kind: "chunk",
        result: { processedBlocks: 10, remainingBlocks: 0, transactions: [] },
      },
    });
    expect(posted[1]).toEqual({ type: "stream", event: { requestId: "s1", kind: "complete" } });
  });

  it("posts a stream error event when start-sync throws", async () => {
    mockStartSyncJob.mockRejectedValue(new Error("engine crashed"));
    const { posted, dispatch } = makePort();
    dispatch({
      type: "start-sync",
      args: {
        requestId: "s1",
        grpcUrl: "u",
        network: "mainnet",
        viewingKey: "vk",
        startBlockHeight: 0,
        maxBatchSize: 100,
      },
    });
    await flush();

    expect(posted).toEqual([
      {
        type: "stream",
        event: { requestId: "s1", kind: "error", message: "engine crashed" },
      },
    ]);
  });

  it("cancels an active sync via the engine hooks", async () => {
    const streamCancel = jest.fn();
    let capturedHooks:
      | { isCancelled: () => boolean; onActiveStream?: (s: { cancel(): void } | null) => void }
      | undefined;
    mockStartSyncJob.mockImplementation(
      (_args: unknown, _onChunk: unknown, hooks: NonNullable<typeof capturedHooks>) => {
        capturedHooks = hooks;
        hooks.onActiveStream?.({ cancel: streamCancel });
        return new Promise(() => {}); // never resolves
      },
    );

    const { dispatch } = makePort();
    dispatch({
      type: "start-sync",
      args: {
        requestId: "s1",
        grpcUrl: "u",
        network: "mainnet",
        viewingKey: "vk",
        startBlockHeight: 0,
        maxBatchSize: 100,
      },
    });
    await flush();

    expect(capturedHooks!.isCancelled()).toBe(false);
    dispatch({ type: "cancel-sync", args: { requestId: "s1" } });
    expect(capturedHooks!.isCancelled()).toBe(true);
    expect(streamCancel).toHaveBeenCalledTimes(1);
  });

  it("swallows errors thrown by the native stream.cancel()", async () => {
    const streamCancel = jest.fn(() => {
      throw new Error("native cancel boom");
    });
    mockStartSyncJob.mockImplementation(
      (
        _args: unknown,
        _onChunk: unknown,
        hooks: { onActiveStream?: (s: { cancel(): void } | null) => void },
      ) => {
        hooks.onActiveStream?.({ cancel: streamCancel });
        return new Promise(() => {});
      },
    );

    const { dispatch } = makePort();
    dispatch({
      type: "start-sync",
      args: {
        requestId: "s1",
        grpcUrl: "u",
        network: "mainnet",
        viewingKey: "vk",
        startBlockHeight: 0,
        maxBatchSize: 100,
      },
    });
    await flush();

    expect(() => dispatch({ type: "cancel-sync", args: { requestId: "s1" } })).not.toThrow();
    expect(streamCancel).toHaveBeenCalledTimes(1);
  });

  it("ignores cancel-sync for an unknown requestId", () => {
    const { dispatch } = makePort();
    expect(() => dispatch({ type: "cancel-sync", args: { requestId: "nope" } })).not.toThrow();
  });

  it("logs and ignores an unknown message type", () => {
    const { posted, dispatch } = makePort();
    dispatch({ type: "totally-unknown" } as unknown as UtilityInboundMessage);
    expect(posted).toEqual([]);
  });
});
