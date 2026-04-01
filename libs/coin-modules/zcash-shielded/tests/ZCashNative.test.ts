/**
 * Tests for ZCashNative — the napi-rs Rust engine wrapper.
 *
 * The native addon (@ledgerhq/zcash-utils) is mocked at module level so these
 * tests run without a .node binary or a live gRPC endpoint.
 */

jest.mock("@ledgerhq/zcash-utils", () => ({
  syncShielded: jest.fn(),
  getChainTip: jest.fn(),
  deriveKeys: jest.fn(),
}));

import { ZCashNative, ShieldedSyncResult } from "../src/ZCash";
import * as nativeUtils from "@ledgerhq/zcash-utils";
import BigNumber from "bignumber.js";
import { ZCASH_GRPC_URL_TESTNET } from "../src/constants";

const mockGetChainTip = nativeUtils.getChainTip as jest.Mock;
const mockSyncShielded = nativeUtils.syncShielded as jest.Mock;

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

function makeSyncResult(
  txs: ReturnType<typeof makeNativeTx>[],
  blocksScanned = 100,
): { transactions: typeof txs; blocksScanned: number; elapsedMs: number } {
  return { transactions: txs, blocksScanned, elapsedMs: 50 };
}

// ─── estimatedSyncTime ───────────────────────────────────────────────────────

describe("estimatedSyncTime", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("should estimate sync time", async () => {
    jest.setSystemTime(new Date("2016-10-28T00:00:00.000Z"));
    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const estimate = await engine.estimatedSyncTime(10);
    jest.setSystemTime(new Date("2016-10-28T00:20:00.000Z"));
    expect(estimate()).toEqual({ hours: 3, minutes: 20 });
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
    expect(mockSyncShielded).not.toHaveBeenCalled();
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
    mockSyncShielded.mockResolvedValue(makeSyncResult([nativeTx]));

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
    mockSyncShielded.mockResolvedValue(makeSyncResult([nativeTx]));

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
    mockSyncShielded.mockResolvedValue(makeSyncResult([], 100));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const steps: ShieldedSyncResult[] = [];
    await engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 100 })
      .forEach(s => steps.push(s));

    expect(mockSyncShielded).toHaveBeenCalledTimes(3);
    expect(steps).toHaveLength(3);
  });

  it("should pass the correct startHeight/endHeight to native.syncShielded per chunk", async () => {
    // tip=249, start=50, maxBatchSize=100 → exactly 2 chunks: [50,149] and [150,249]
    mockGetChainTip.mockResolvedValue(249);
    mockSyncShielded.mockResolvedValue(makeSyncResult([], 100));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    await engine
      .syncShielded({ startBlockHeight: 50, viewingKey: "uview1key", maxBatchSize: 100 })
      .forEach(() => {});

    expect(mockSyncShielded).toHaveBeenCalledTimes(2);
    expect(mockSyncShielded).toHaveBeenNthCalledWith(1, {
      grpcUrl: ZCASH_GRPC_URL_TESTNET,
      viewingKey: "uview1key",
      startHeight: 50,
      endHeight: 149,
    });
    expect(mockSyncShielded).toHaveBeenNthCalledWith(2, {
      grpcUrl: ZCASH_GRPC_URL_TESTNET,
      viewingKey: "uview1key",
      startHeight: 150,
      endHeight: 249,
    });
  });

  it("should end the last chunk exactly at chain tip", async () => {
    mockGetChainTip.mockResolvedValue(250);
    mockSyncShielded.mockResolvedValue(makeSyncResult([], 100));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    await engine
      .syncShielded({ startBlockHeight: 50, viewingKey: "uview1abc", maxBatchSize: 100 })
      .forEach(() => {});

    const lastCall = mockSyncShielded.mock.calls[mockSyncShielded.mock.calls.length - 1][0];
    expect(lastCall.endHeight).toBe(250);
  });

  it("should accumulate transactions across chunks", async () => {
    mockGetChainTip.mockResolvedValue(199);
    const tx1 = makeNativeTx({ txid: "tx1", blockHeight: 50 });
    const tx2 = makeNativeTx({ txid: "tx2", blockHeight: 150 });
    mockSyncShielded
      .mockResolvedValueOnce(makeSyncResult([tx1], 100))
      .mockResolvedValueOnce(makeSyncResult([tx2], 100));

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
    mockSyncShielded.mockResolvedValue(makeSyncResult([], 100));

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
    expect(mockSyncShielded).toHaveBeenCalledTimes(1);
  });

  it("should emit correct remainingBlocks per chunk", async () => {
    // tip=299, start=0, maxBatchSize=100 → 3 chunks
    mockGetChainTip.mockResolvedValue(299);
    mockSyncShielded.mockResolvedValue(makeSyncResult([], 100));

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

// ─── syncShielded — retry logic ──────────────────────────────────────────────

describe("syncShielded — retry logic", () => {
  let setTimeoutSpy: jest.SpyInstance;
  beforeEach(() => {
    // Make backoff delays instant so retry tests don't block for 1-3 seconds each
    setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((fn: TimerHandler) => {
      (fn as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });
  afterEach(() => setTimeoutSpy.mockRestore());

  it("should retry up to 3 times on transient gRPC errors then succeed", async () => {
    mockGetChainTip.mockResolvedValue(100);
    mockSyncShielded
      .mockRejectedValueOnce(new Error("gRPC EOF"))
      .mockRejectedValueOnce(new Error("gRPC EOF"))
      .mockResolvedValueOnce(makeSyncResult([], 101));

    const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
    const steps: ShieldedSyncResult[] = [];
    await engine
      .syncShielded({ startBlockHeight: 0, viewingKey: "uview1abc", maxBatchSize: 200 })
      .forEach(s => steps.push(s));

    expect(mockSyncShielded).toHaveBeenCalledTimes(3);
    expect(steps).toHaveLength(1);
  });

  it("should propagate the error after 3 failed attempts", async () => {
    mockGetChainTip.mockResolvedValue(100);
    const gRPCError = new Error("gRPC stream broken");
    mockSyncShielded.mockRejectedValue(gRPCError);

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

    expect(mockSyncShielded).toHaveBeenCalledTimes(3);
    expect(steps).toHaveLength(0);
    expect(caught).toBe(gRPCError);
  });
});
