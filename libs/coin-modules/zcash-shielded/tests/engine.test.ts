/**
 * Tests for the native ZCash engine — the host-side wrapper around the
 * napi-rs Rust addon (`@ledgerhq/zcash-utils`), mocked here so the suite
 * runs without a `.node` binary or a live gRPC endpoint.
 *
 * The engine emits IPC-safe `ShieldedSyncResultRaw` chunks (fee/amount as
 * string). Renderer-side BigNumber reconstruction is tested separately in
 * `ZCashNative.test.ts`.
 */

jest.mock("@ledgerhq/zcash-utils", () => ({
  startSync: jest.fn(),
  getChainTip: jest.fn(),
  deriveKeys: jest.fn(),
}));

import {
  getChainTipJob,
  startSyncJob,
  validateStartSyncArgs,
  type StartSyncJobArgs,
} from "../src/native-engine/engine";
import * as nativeUtils from "@ledgerhq/zcash-utils";
import { ZCASH_GRPC_URL_TESTNET } from "../src/constants";
import type { ShieldedSyncResultRaw } from "../src/types";

const mockGetChainTip = nativeUtils.getChainTip as jest.Mock;
const mockStartSync = nativeUtils.startSync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeNativeTx(overrides: Partial<ReturnType<typeof baseNativeTx>> = {}) {
  return { ...baseNativeTx(), ...overrides };
}

function baseNativeTx() {
  return {
    txid: "abc123",
    hex: "deadbeef",
    blockHeight: 100,
    blockHash: "blockhash1",
    blockTime: 1700000000,
    fee: 5000,
    saplingNotes: [] as { amount: number; transferType: string; memo: string }[],
    orchardNotes: [{ amount: 5000, transferType: "incoming", memo: "hello" }],
  };
}

function makeStream(txs: ReturnType<typeof makeNativeTx>[], blocksScanned = 100) {
  let index = 0;
  return {
    next: jest.fn(() => Promise.resolve(index < txs.length ? txs[index++] : null)),
    stats: jest.fn(() => Promise.resolve({ blocksScanned })),
    cancel: jest.fn(),
  };
}

/**
 * A stream whose `next()` hangs forever until `release()` is called.
 * Lets a test trigger a cancel while the engine is awaiting the native stream.
 */
function makeHangingStream() {
  let release!: (value: null) => void;
  const pending = new Promise<null>(resolve => {
    release = resolve;
  });
  return {
    stream: {
      next: jest.fn(() => pending),
      stats: jest.fn(() => Promise.resolve({ blocksScanned: 0 })),
      cancel: jest.fn(),
    },
    release: () => release(null),
  };
}

function makeArgs(overrides: Partial<StartSyncJobArgs> = {}): StartSyncJobArgs {
  return {
    grpcUrl: ZCASH_GRPC_URL_TESTNET,
    network: "mainnet",
    viewingKey: "uview1abc",
    startBlockHeight: 0,
    maxBatchSize: 100,
    ...overrides,
  };
}

/**
 * Runs `startSyncJob` to completion, collecting every emitted chunk.
 * `hooks` overrides let tests inject `isCancelled` / `onActiveStream` spies.
 */
async function collectChunks(
  args: StartSyncJobArgs,
  hooks: Partial<Parameters<typeof startSyncJob>[2]> = {},
): Promise<ShieldedSyncResultRaw[]> {
  const chunks: ShieldedSyncResultRaw[] = [];
  await startSyncJob(args, chunk => chunks.push(chunk), {
    isCancelled: hooks.isCancelled ?? (() => false),
    onActiveStream: hooks.onActiveStream,
  });
  return chunks;
}

// ─── validateStartSyncArgs ───────────────────────────────────────────────────

describe("validateStartSyncArgs", () => {
  it.each([
    { startBlockHeight: -1, maxBatchSize: 100 },
    { startBlockHeight: 0, maxBatchSize: -5 },
    { startBlockHeight: 0, maxBatchSize: 0 },
  ])(
    "should reject invalid args ($startBlockHeight, $maxBatchSize)",
    ({ startBlockHeight, maxBatchSize }) => {
      expect(validateStartSyncArgs({ startBlockHeight, maxBatchSize })).toMatch(/^error: invalid/);
    },
  );

  it("should accept valid args", () => {
    expect(validateStartSyncArgs({ startBlockHeight: 0, maxBatchSize: 100 })).toBeNull();
    expect(validateStartSyncArgs({ startBlockHeight: 1_000_000, maxBatchSize: 1 })).toBeNull();
  });
});

// ─── getChainTipJob ──────────────────────────────────────────────────────────

describe("getChainTipJob", () => {
  it("should return the chain tip from the native module", async () => {
    mockGetChainTip.mockResolvedValue(3_936_000);
    const tip = await getChainTipJob(ZCASH_GRPC_URL_TESTNET);
    expect(tip).toBe(3_936_000);
    expect(mockGetChainTip).toHaveBeenCalledWith(ZCASH_GRPC_URL_TESTNET);
  });
});

// ─── startSyncJob — already at tip ───────────────────────────────────────────

describe("startSyncJob — already at chain tip", () => {
  it("should emit one empty chunk when startBlockHeight > chainTip", async () => {
    mockGetChainTip.mockResolvedValue(100);

    const chunks = await collectChunks(makeArgs({ startBlockHeight: 200, maxBatchSize: 1000 }));

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({ processedBlocks: 0, remainingBlocks: 0, transactions: [] });
    expect(mockStartSync).not.toHaveBeenCalled();
  });
});

// ─── startSyncJob — native tx mapping ────────────────────────────────────────

describe("startSyncJob — native transaction mapping", () => {
  it("should map native tx fields to ShieldedTransactionRaw (strings, not BigNumber)", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const nativeTx = makeNativeTx({
      txid: "txid1",
      hex: "cafebabe",
      blockHeight: 150,
      blockHash: "bh1",
      blockTime: 1700000042,
      orchardNotes: [{ amount: 3000, transferType: "incoming", memo: "test memo" }],
      saplingNotes: [{ amount: 1500, transferType: "outgoing", memo: "" }],
    });
    mockStartSync.mockResolvedValue(makeStream([nativeTx]));

    const chunks = await collectChunks(makeArgs({ startBlockHeight: 100, maxBatchSize: 200 }));

    const tx = chunks[chunks.length - 1].transactions[0];
    expect(tx).toEqual({
      id: "txid1",
      hex: "cafebabe",
      blockHeight: 150,
      blockHash: "bh1",
      timestamp: 1700000042,
      fee: "5000",
      decryptedData: {
        orchard_outputs: [{ amount: "3000", memo: "test memo", transfer_type: "incoming" }],
        sapling_outputs: [{ amount: "1500", memo: "", transfer_type: "outgoing" }],
      },
    });
  });

  it("should emit amounts as strings (IPC-safe, no BigNumber)", async () => {
    mockGetChainTip.mockResolvedValue(100);
    const nativeTx = makeNativeTx({
      orchardNotes: [{ amount: 99_999_999, transferType: "incoming", memo: "" }],
      saplingNotes: [],
    });
    mockStartSync.mockResolvedValue(makeStream([nativeTx]));

    const chunks = await collectChunks(makeArgs({ startBlockHeight: 0, maxBatchSize: 200 }));

    const tx = chunks[0].transactions[0];
    expect(typeof tx.fee).toBe("string");
    expect(tx.fee).toBe("5000");
    const amount = tx.decryptedData?.orchard_outputs[0].amount;
    expect(typeof amount).toBe("string");
    expect(amount).toBe("99999999");
  });
});

// ─── startSyncJob — chunking ─────────────────────────────────────────────────

describe("startSyncJob — chunking", () => {
  it("should scan in maxBatchSize chunks and emit once per chunk", async () => {
    // tip=299, start=0, maxBatchSize=100 → 3 chunks: [0,99], [100,199], [200,299]
    mockGetChainTip.mockResolvedValue(299);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    const chunks = await collectChunks(makeArgs({ maxBatchSize: 100 }));

    expect(mockStartSync).toHaveBeenCalledTimes(3);
    expect(chunks).toHaveLength(3);
  });

  it("should pass the correct startHeight/endHeight to native.startSync per chunk", async () => {
    // tip=249, start=50, maxBatchSize=100 → exactly 2 chunks: [50,149] and [150,249]
    mockGetChainTip.mockResolvedValue(249);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    await collectChunks(
      makeArgs({ startBlockHeight: 50, maxBatchSize: 100, viewingKey: "uview1key" }),
    );

    expect(mockStartSync).toHaveBeenCalledTimes(2);
    expect(mockStartSync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        grpcUrl: ZCASH_GRPC_URL_TESTNET,
        viewingKey: "uview1key",
        startHeight: 50,
        endHeight: 149,
      }),
    );
    expect(mockStartSync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        grpcUrl: ZCASH_GRPC_URL_TESTNET,
        viewingKey: "uview1key",
        startHeight: 150,
        endHeight: 249,
      }),
    );
  });

  it("should end the last chunk exactly at chain tip", async () => {
    mockGetChainTip.mockResolvedValue(250);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    await collectChunks(makeArgs({ startBlockHeight: 50, maxBatchSize: 100 }));

    const lastCall = mockStartSync.mock.calls[mockStartSync.mock.calls.length - 1][0];
    expect(lastCall.endHeight).toBe(250);
  });

  it("should accumulate transactions across chunks", async () => {
    mockGetChainTip.mockResolvedValue(199);
    const tx1 = makeNativeTx({ txid: "tx1", blockHeight: 50 });
    const tx2 = makeNativeTx({ txid: "tx2", blockHeight: 150 });
    mockStartSync
      .mockResolvedValueOnce(makeStream([tx1], 100))
      .mockResolvedValueOnce(makeStream([tx2], 100));

    const chunks = await collectChunks(makeArgs({ maxBatchSize: 100 }));

    expect(chunks[0].transactions).toHaveLength(1);
    expect(chunks[1].transactions).toHaveLength(2); // cumulative
    expect(chunks[1].transactions.map(t => t.id)).toEqual(["tx1", "tx2"]);
  });

  it("should stop scanning when isCancelled() returns true between chunks", async () => {
    mockGetChainTip.mockResolvedValue(299);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    let cancelled = false;
    const chunks: ShieldedSyncResultRaw[] = [];
    await startSyncJob(
      makeArgs({ maxBatchSize: 100 }),
      chunk => {
        chunks.push(chunk);
        cancelled = true; // cancel after the first emit
      },
      { isCancelled: () => cancelled },
    );

    expect(chunks).toHaveLength(1);
    expect(mockStartSync).toHaveBeenCalledTimes(1);
  });

  it("should emit correct remainingBlocks per chunk", async () => {
    mockGetChainTip.mockResolvedValue(299);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    const chunks = await collectChunks(makeArgs({ maxBatchSize: 100 }));

    expect(chunks[0].remainingBlocks).toBe(200); // 299 - 99
    expect(chunks[1].remainingBlocks).toBe(100); // 299 - 199
    expect(chunks[2].remainingBlocks).toBe(0); // 299 - 299
  });
});

// ─── startSyncJob — error propagation ────────────────────────────────────────
// Note: network retries are delegated to the Rust layer via maxRetries.
// From the TypeScript perspective, startSync either resolves or rejects once.

describe("startSyncJob — error propagation", () => {
  it("should propagate a startSync error to the caller", async () => {
    mockGetChainTip.mockResolvedValue(100);
    const gRPCError = new Error("gRPC stream broken");
    mockStartSync.mockRejectedValue(gRPCError);

    await expect(collectChunks(makeArgs({ maxBatchSize: 200 }))).rejects.toBe(gRPCError);
    expect(mockStartSync).toHaveBeenCalledTimes(1);
  });
});

// ─── startSyncJob — active-stream hook / cancellation ────────────────────────

describe("startSyncJob — onActiveStream hook", () => {
  it("should expose the current stream so the host can cancel it mid-flight", async () => {
    mockGetChainTip.mockResolvedValue(299);
    const { stream, release } = makeHangingStream();
    mockStartSync.mockResolvedValue(stream);

    let cancelled = false;
    let activeStream: { cancel: jest.Mock } | null = null;
    const jobPromise = startSyncJob(
      makeArgs({ maxBatchSize: 100 }),
      () => {},
      {
        isCancelled: () => cancelled,
        onActiveStream: s => {
          activeStream = s as typeof activeStream;
        },
      },
    );

    // Wait for the engine to enter stream.next()
    await waitFor(() => expect(stream.next).toHaveBeenCalled());
    expect(activeStream).not.toBeNull();
    expect(stream.cancel).not.toHaveBeenCalled();

    // Host-triggered cancel: flip the flag and cancel the in-flight stream.
    cancelled = true;
    activeStream!.cancel();
    release();

    await jobPromise;
    // Note: the engine defensively re-checks isCancelled() after stream.next() resolves
    // and may call stream.cancel() a second time as belt-and-braces. What matters is that
    // (a) cancel was called at least once, and (b) no further chunk was started.
    expect(stream.cancel).toHaveBeenCalled();
    expect(mockStartSync).toHaveBeenCalledTimes(1);
  });

  it("should clear the active stream handle after each chunk", async () => {
    mockGetChainTip.mockResolvedValue(99);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    const seen: Array<unknown> = [];
    await startSyncJob(makeArgs({ maxBatchSize: 100 }), () => {}, {
      isCancelled: () => false,
      onActiveStream: s => seen.push(s),
    });

    // At least one stream set + one cleared (null) per chunk.
    expect(seen).toContain(null);
    expect(seen.filter(s => s !== null).length).toBeGreaterThanOrEqual(1);
  });
});

// ─── helpers used by async tests ─────────────────────────────────────────────

async function waitFor(assertion: () => void, { timeoutMs = 500, intervalMs = 5 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      assertion();
      return;
    } catch (err) {
      lastError = err;
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  throw lastError;
}
