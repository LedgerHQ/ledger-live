/**
 * Tests for ZCashNative — the napi-rs Rust engine wrapper.
 *
 * The native addon (@ledgerhq/zcash-utils) is mocked at module level so these
 * tests run without a .node binary or a live gRPC endpoint.
 */

jest.mock("@ledgerhq/zcash-utils", () => ({
  startSync: jest.fn(),
  getChainTip: jest.fn(),
  deriveKeys: jest.fn(),
}));

import { ZCashNative } from "../src/ZCashNative";
import type { ShieldedSyncResult } from "../src/types";
import * as nativeUtils from "@ledgerhq/zcash-utils";
import BigNumber from "bignumber.js";
import { ZCASH_GRPC_URL_TESTNET } from "../src/constants";

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
 * Lets a test trigger teardown while the engine is awaiting the native stream.
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

// ─── estimatedSyncTime ───────────────────────────────────────────────────────

describe("estimatedSyncTime", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("should estimate remaining sync time based on throughput", async () => {
    jest.setSystemTime(new Date("2016-10-28T00:00:00.000Z"));
    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const estimate = await engine.estimatedSyncTime(10);
    jest.setSystemTime(new Date("2016-10-28T00:20:00.000Z"));
    // 2 blocks done in 20 min → 10 min/block → 8 remaining → 80 min = 1h20m
    expect(estimate(2)).toEqual({ hours: 1, minutes: 20 });
  });

  it("should return zero estimate when no blocks processed yet", async () => {
    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const estimate = await engine.estimatedSyncTime(100);
    expect(estimate(0)).toEqual({ hours: 0, minutes: 0 });
  });
});

// ─── getChainTip ─────────────────────────────────────────────────────────────

describe("getChainTip", () => {
  it("should return the chain tip from the native module", async () => {
    mockGetChainTip.mockResolvedValue(3_936_000);
    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const tip = await engine.getChainTip();
    expect(tip).toBe(3_936_000);
    expect(mockGetChainTip).toHaveBeenCalledWith(ZCASH_GRPC_URL_TESTNET);
  });
});

// ─── syncShielded — argument validation ──────────────────────────────────────

describe("syncShielded — argument validation", () => {
  it.each([
    { startBlockHeight: -1, maxBatchSize: 100 },
    { startBlockHeight: 0, maxBatchSize: -5 },
    { startBlockHeight: 0, maxBatchSize: 0 },
  ])(
    "should error on invalid args ($startBlockHeight, $maxBatchSize)",
    async ({ startBlockHeight, maxBatchSize }) => {
      const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
      const steps: ShieldedSyncResult[] = [];
      let caught: unknown;

      try {
        await engine
          .syncShielded({ startBlockHeight, viewingKey: "uview1abc", maxBatchSize })
          .forEach(s => steps.push(s));
      } catch (err) {
        caught = err;
      }

      expect(steps).toHaveLength(0);
      expect(caught).toMatch(/^error: invalid/);
    },
  );
});

// ─── syncShielded — already at tip ───────────────────────────────────────────

describe("syncShielded — already at chain tip", () => {
  it("should emit one empty result and complete when startBlockHeight > chainTip", async () => {
    mockGetChainTip.mockResolvedValue(100);
    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });

    const steps: ShieldedSyncResult[] = [];
    await engine
      .syncShielded({ startBlockHeight: 200, viewingKey: "uview1abc", maxBatchSize: 1000 })
      .forEach(s => steps.push(s));

    expect(steps).toHaveLength(1);
    expect(steps[0]).toEqual({ processedBlocks: 0, remainingBlocks: 0, transactions: [] });
    expect(mockStartSync).not.toHaveBeenCalled();
  });
});

// ─── syncShielded — native tx mapping ────────────────────────────────────────

describe("syncShielded — native transaction mapping", () => {
  it("should map native tx fields to ShieldedTransaction shape", async () => {
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

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const steps: ShieldedSyncResult[] = [];
    await engine
      .syncShielded({ startBlockHeight: 100, viewingKey: "uview1abc", maxBatchSize: 200 })
      .forEach(s => steps.push(s));

    const tx = steps[steps.length - 1].transactions[0];
    expect(tx).toMatchObject({
      id: "txid1",
      hex: "cafebabe",
      blockHeight: 150,
      blockHash: "bh1",
      timestamp: 1700000042,
      fee: new BigNumber(5000),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(3000), memo: "test memo", transfer_type: "incoming" },
        ],
        sapling_outputs: [{ amount: new BigNumber(1500), memo: "", transfer_type: "outgoing" }],
      },
    });
  });

  it("should convert native note amounts to BigNumber", async () => {
    mockGetChainTip.mockResolvedValue(100);
    const nativeTx = makeNativeTx({
      orchardNotes: [{ amount: 99_999_999, transferType: "incoming", memo: "" }],
      saplingNotes: [],
    });
    mockStartSync.mockResolvedValue(makeStream([nativeTx]));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const steps: ShieldedSyncResult[] = [];
    await engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 200 })
      .forEach(s => steps.push(s));

    const tx = steps[0].transactions[0];
    const amount = tx.decryptedData?.orchard_outputs[0].amount;
    expect(amount).toBeInstanceOf(BigNumber);
    expect(amount).toEqual(new BigNumber(99_999_999));
    expect(tx.fee).toBeInstanceOf(BigNumber);
    expect(tx.fee).toEqual(new BigNumber(5000));
  });
});

// ─── syncShielded — chunking ─────────────────────────────────────────────────

describe("syncShielded — chunking", () => {
  it("should scan in maxBatchSize chunks and emit once per chunk", async () => {
    // tip=299, start=0, maxBatchSize=100 → 3 chunks: [0,99], [100,199], [200,299]
    mockGetChainTip.mockResolvedValue(299);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const steps: ShieldedSyncResult[] = [];
    await engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
      .forEach(s => steps.push(s));

    expect(mockStartSync).toHaveBeenCalledTimes(3);
    expect(steps).toHaveLength(3);
  });

  it("should pass the correct startHeight/endHeight to native.syncShielded per chunk", async () => {
    // tip=249, start=50, maxBatchSize=100 → exactly 2 chunks: [50,149] and [150,249]
    mockGetChainTip.mockResolvedValue(249);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    await engine
      .syncShielded({ startBlockHeight: 50, viewingKey: "uview1key", maxBatchSize: 100 })
      .forEach(() => {});

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

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    await engine
      .syncShielded({ startBlockHeight: 50, viewingKey: "uview1abc", maxBatchSize: 100 })
      .forEach(() => {});

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

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const steps: ShieldedSyncResult[] = [];
    await engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
      .forEach(s => steps.push(s));

    expect(steps[0].transactions).toHaveLength(1);
    expect(steps[1].transactions).toHaveLength(2); // cumulative
    expect(steps[1].transactions.map(t => t.id)).toEqual(["tx1", "tx2"]);
  });

  it("should stop scanning when the subscriber unsubscribes mid-sync", async () => {
    // 3 chunks available, but unsubscribe after the first emit
    mockGetChainTip.mockResolvedValue(299);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const steps: ShieldedSyncResult[] = [];

    await new Promise<void>(resolve => {
      const subscription = engine
        .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
        .subscribe({
          next: step => {
            steps.push(step);
            subscription.unsubscribe(); // cancel after first chunk
          },
          complete: resolve,
          error: resolve,
        });
      // Give the async loop a chance to check subscriber.closed
      setTimeout(resolve, 50);
    });

    expect(steps).toHaveLength(1);
    // Only the first chunk should have been fetched
    expect(mockStartSync).toHaveBeenCalledTimes(1);
  });

  it("should emit correct remainingBlocks per chunk", async () => {
    // tip=299, start=0, maxBatchSize=100 → 3 chunks
    mockGetChainTip.mockResolvedValue(299);
    mockStartSync.mockResolvedValue(makeStream([], 100));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const steps: ShieldedSyncResult[] = [];
    await engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
      .forEach(s => steps.push(s));

    expect(steps[0].remainingBlocks).toBe(200); // 299 - 99
    expect(steps[1].remainingBlocks).toBe(100); // 299 - 199
    expect(steps[2].remainingBlocks).toBe(0); // 299 - 299
  });
});

// ─── syncShielded — error propagation ────────────────────────────────────────
// Note: network retries are delegated to the Rust layer via maxRetries.
// From the TypeScript perspective, startSync either resolves or rejects once.

describe("syncShielded — error propagation", () => {
  it("should propagate a startSync error to the subscriber", async () => {
    mockGetChainTip.mockResolvedValue(100);
    const gRPCError = new Error("gRPC stream broken");
    mockStartSync.mockRejectedValue(gRPCError);

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    let caught: unknown;
    const steps: ShieldedSyncResult[] = [];

    try {
      await engine
        .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 200 })
        .forEach(s => steps.push(s));
    } catch (err) {
      caught = err;
    }

    expect(mockStartSync).toHaveBeenCalledTimes(1);
    expect(steps).toHaveLength(0);
    expect(caught).toBe(gRPCError);
  });
});

// ─── syncShielded — teardown / cancellation ──────────────────────────────────

describe("syncShielded — teardown cancels in-flight stream", () => {
  it("should call stream.cancel() immediately on unsubscribe (without waiting for next() to resolve)", async () => {
    mockGetChainTip.mockResolvedValue(299);
    const { stream, release } = makeHangingStream();
    mockStartSync.mockResolvedValue(stream);

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const subscription = engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
      .subscribe({ next: () => {}, error: () => {}, complete: () => {} });

    // Wait for the engine to call startSync and begin awaiting stream.next()
    await waitFor(() => expect(stream.next).toHaveBeenCalled());
    expect(stream.cancel).not.toHaveBeenCalled();

    // Unsubscribe while next() is still pending — this is the previously-broken case
    subscription.unsubscribe();

    expect(stream.cancel).toHaveBeenCalledTimes(1);

    // Cleanup: release the hanging promise so the IIFE doesn't dangle
    release();
  });

  it("should not start a new chunk after teardown", async () => {
    mockGetChainTip.mockResolvedValue(299);
    const { stream, release } = makeHangingStream();
    mockStartSync.mockResolvedValue(stream);

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const subscription = engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
      .subscribe({ next: () => {}, error: () => {}, complete: () => {} });

    await waitFor(() => expect(stream.next).toHaveBeenCalled());
    subscription.unsubscribe();

    // Resolve the pending next() with null so the engine drains the chunk —
    // the abort flag should still prevent any further startSync call.
    release();
    await flushMicrotasks();

    expect(mockStartSync).toHaveBeenCalledTimes(1);
  });

  it("should be a no-op (and not throw) when unsubscribed after natural completion", async () => {
    mockGetChainTip.mockResolvedValue(99);
    const stream = makeStream([], 100);
    mockStartSync.mockResolvedValue(stream);

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    await new Promise<void>((resolve, reject) => {
      const subscription = engine
        .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
        .subscribe({
          next: () => {},
          error: reject,
          complete: () => {
            subscription.unsubscribe();
            resolve();
          },
        });
    });

    // Stream completed naturally — teardown ran post-complete with no active stream,
    // so cancel() must NOT have been called.
    expect(stream.cancel).not.toHaveBeenCalled();
  });

  it("should swallow errors thrown by stream.cancel() during teardown", async () => {
    mockGetChainTip.mockResolvedValue(299);
    const { stream, release } = makeHangingStream();
    stream.cancel.mockImplementation(() => {
      throw new Error("native cancel failed");
    });
    mockStartSync.mockResolvedValue(stream);

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const subscription = engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
      .subscribe({ next: () => {}, error: () => {}, complete: () => {} });

    await waitFor(() => expect(stream.next).toHaveBeenCalled());

    // Teardown must not propagate the cancel() exception
    expect(() => subscription.unsubscribe()).not.toThrow();
    expect(stream.cancel).toHaveBeenCalledTimes(1);

    release();
  });
});

// ─── helpers used by teardown tests ──────────────────────────────────────────

async function flushMicrotasks(times = 5) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}

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
