import type { ShieldedSyncResultRaw } from "../../types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

const mockGetChainTip = jest.fn<Promise<number>, [string]>();
const mockFindBlockHeight = jest.fn<Promise<number>, [string, number]>();
const mockStartSync = jest.fn();
const mockParsePczt = jest.fn();
const mockBuildTransaction = jest.fn();
const mockBuildIronwoodTransaction = jest.fn();
const mockFinalizeTransaction = jest.fn();
const mockBroadcastTransaction = jest.fn();

// Mutable module object so individual tests can delete a PCZT method to
// exercise the `getPcztModule` capability guard. `__esModule: true` makes the
// interop return this exact object, so mutations are visible to the SUT.
const mockNativeModule: Record<string, unknown> = {
  __esModule: true,
  getChainTip: (...args: unknown[]) => mockGetChainTip(...(args as [string])),
  findBlockHeight: (...args: unknown[]) => mockFindBlockHeight(...(args as [string, number])),
  startSync: (...args: unknown[]) => mockStartSync(...(args as [unknown])),
  parsePczt: (...args: unknown[]) => mockParsePczt(...args),
  buildTransaction: (...args: unknown[]) => mockBuildTransaction(...args),
  buildIronwoodTransaction: (...args: unknown[]) => mockBuildIronwoodTransaction(...args),
  finalizeTransaction: (...args: unknown[]) => mockFinalizeTransaction(...args),
  broadcastTransaction: (...args: unknown[]) => mockBroadcastTransaction(...args),
};

jest.mock("@ledgerhq/zcash-utils", () => mockNativeModule);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a fake native transaction matching the NativeTx shape. */
function makeNativeTx(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    txid: "txid-abc",
    hex: "deadbeef",
    blockHeight: 500,
    blockHash: "blockhash-abc",
    blockTime: 1700000000,
    fee: 10000n, // bigint from Rust layer -- String() should produce "10000"
    orchardNotes: [{ amount: 50000n, memo: "hello", transferType: "incoming" }],
    saplingNotes: [{ amount: 20000n, memo: "", transferType: "outgoing" }],
    ...overrides,
  };
}

/** Helper to build a mock stream returned by native.startSync. */
function makeMockStream(
  transactions: ReturnType<typeof makeNativeTx>[],
  stats: { blocksScanned: number; elapsedMs: number } = {
    blocksScanned: 100,
    elapsedMs: 250,
  },
) {
  let idx = 0;
  return {
    next: jest.fn(async () => {
      if (idx < transactions.length) {
        return transactions[idx++];
      }
      return null;
    }),
    cancel: jest.fn(),
    stats: jest.fn(async () => stats),
  };
}

// ---------------------------------------------------------------------------
// Import SUT (after mocks are registered)
// ---------------------------------------------------------------------------

import {
  validateStartSyncArgs,
  getChainTipJob,
  findBlockHeightJob,
  startSyncJob,
  buildTransactionJob,
  buildIronwoodTransactionJob,
  finalizeTransactionJob,
  broadcastTransactionJob,
  type StartSyncJobArgs,
} from "../engine";
import type {
  BuildTransactionArgs,
  BuildIronwoodTransactionArgs,
  FinalizeTransactionArgs,
} from "../../types";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ── validateStartSyncArgs ──────────────────────────────────────────────

describe("validateStartSyncArgs", () => {
  it("returns error for negative startBlockHeight", () => {
    const result = validateStartSyncArgs({ startBlockHeight: -1, maxBatchSize: 100 });
    expect(result).toBe("error: invalid negative arg startBlockHeight");
  });

  it("returns error for zero maxBatchSize", () => {
    const result = validateStartSyncArgs({ startBlockHeight: 0, maxBatchSize: 0 });
    expect(result).toBe("error: invalid negative or zero arg maxBatchSize");
  });

  it("returns error for negative maxBatchSize", () => {
    const result = validateStartSyncArgs({ startBlockHeight: 0, maxBatchSize: -5 });
    expect(result).toBe("error: invalid negative or zero arg maxBatchSize");
  });

  it("returns null for valid args", () => {
    const result = validateStartSyncArgs({ startBlockHeight: 0, maxBatchSize: 100 });
    expect(result).toBeNull();
  });

  it("returns null when startBlockHeight is 0 and maxBatchSize is 1", () => {
    const result = validateStartSyncArgs({ startBlockHeight: 0, maxBatchSize: 1 });
    expect(result).toBeNull();
  });
});

// ── getChainTipJob ─────────────────────────────────────────────────────

describe("getChainTipJob", () => {
  it("calls native.getChainTip with the grpcUrl and returns the height", async () => {
    mockGetChainTip.mockResolvedValue(1_000_000);
    const result = await getChainTipJob("https://grpc.example.com");
    expect(mockGetChainTip).toHaveBeenCalledWith("https://grpc.example.com");
    expect(result).toBe(1_000_000);
  });
});

// ── findBlockHeightJob ─────────────────────────────────────────────────

describe("findBlockHeightJob", () => {
  it("calls native.findBlockHeight with grpcUrl and timestamp, returns the height", async () => {
    mockFindBlockHeight.mockResolvedValue(800_000);
    const result = await findBlockHeightJob("https://grpc.example.com", 1700000000);
    expect(mockFindBlockHeight).toHaveBeenCalledWith("https://grpc.example.com", 1700000000);
    expect(result).toBe(800_000);
  });
});

// ── startSyncJob ───────────────────────────────────────────────────────

describe("startSyncJob", () => {
  const baseArgs: StartSyncJobArgs = {
    grpcUrl: "https://grpc.example.com",
    network: "main",
    viewingKey: "vk-123",
    startBlockHeight: 100,
    maxBatchSize: 500,
  };

  // The chunk still has to carry the cursor: consumers persist it, and an absent
  // cursor reads as "nothing known" and sends the next sync back to the account
  // birthday — a full rescan on every poll of an already-synced account.
  it("reports the unchanged cursor when already at tip (startBlockHeight > endHeight)", async () => {
    mockGetChainTip.mockResolvedValue(50); // endHeight < startBlockHeight
    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled: () => false });

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onChunk).toHaveBeenCalledWith({
      processedBlocks: 0,
      remainingBlocks: 0,
      lastProcessedBlock: baseArgs.startBlockHeight - 1,
      transactions: [],
    });
    expect(mockStartSync).not.toHaveBeenCalled();
  });

  it("short-circuits when cancelled before getChainTip resolves", async () => {
    mockGetChainTip.mockResolvedValue(1000);
    const onChunk = jest.fn();
    // isCancelled returns true immediately
    await startSyncJob(baseArgs, onChunk, { isCancelled: () => true });

    expect(onChunk).not.toHaveBeenCalled();
    expect(mockStartSync).not.toHaveBeenCalled();
  });

  it("processes a single chunk with no transactions", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const stream = makeMockStream([]); // no txs
    mockStartSync.mockResolvedValue(stream);

    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled: () => false });

    expect(mockStartSync).toHaveBeenCalledTimes(1);
    expect(mockStartSync).toHaveBeenCalledWith(
      expect.objectContaining({
        grpcUrl: baseArgs.grpcUrl,
        viewingKey: baseArgs.viewingKey,
        startHeight: 100,
        endHeight: 200,
        network: "main",
        orchardOnly: false,
        maxRetries: 3,
      }),
    );

    expect(onChunk).toHaveBeenCalledTimes(1);
    const chunk: ShieldedSyncResultRaw = onChunk.mock.calls[0][0];
    expect(chunk.processedBlocks).toBe(100);
    expect(chunk.remainingBlocks).toBe(0);
    expect(chunk.lastProcessedBlock).toBe(200);
    expect(chunk.transactions).toEqual([]);
  });

  it("processes a single chunk with transactions and maps them correctly", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const tx = makeNativeTx();
    const stream = makeMockStream([tx]);
    mockStartSync.mockResolvedValue(stream);

    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled: () => false });

    expect(onChunk).toHaveBeenCalledTimes(1);
    const chunk: ShieldedSyncResultRaw = onChunk.mock.calls[0][0];
    expect(chunk.transactions).toHaveLength(1);

    const mapped = chunk.transactions[0];
    expect(mapped.id).toBe("txid-abc");
    expect(mapped.hex).toBe("deadbeef");
    expect(mapped.blockHeight).toBe(500);
    expect(mapped.blockHash).toBe("blockhash-abc");
    expect(mapped.timestamp).toBe(1700000000);
    // fee is bigint 10000n -> String() -> "10000"
    expect(mapped.fee).toBe("10000");
    expect(mapped.decryptedData).toEqual({
      orchard_outputs: [{ amount: "50000", memo: "hello", transfer_type: "incoming" }],
      sapling_outputs: [{ amount: "20000", memo: "", transfer_type: "outgoing" }],
    });
  });

  it("handles multiple chunks when range exceeds maxBatchSize", async () => {
    // range: 100..1099 with maxBatchSize=500 -> 2 chunks: [100..599], [600..1099]
    const args: StartSyncJobArgs = { ...baseArgs, maxBatchSize: 500 };
    mockGetChainTip.mockResolvedValue(1099);

    const tx1 = makeNativeTx({ txid: "tx-chunk1", blockHeight: 150 });
    const tx2 = makeNativeTx({ txid: "tx-chunk2", blockHeight: 700 });

    const stream1 = makeMockStream([tx1], { blocksScanned: 500, elapsedMs: 100 });
    const stream2 = makeMockStream([tx2], { blocksScanned: 500, elapsedMs: 100 });

    mockStartSync.mockResolvedValueOnce(stream1).mockResolvedValueOnce(stream2);

    const onChunk = jest.fn();
    await startSyncJob(args, onChunk, { isCancelled: () => false });

    expect(mockStartSync).toHaveBeenCalledTimes(2);

    // First chunk: startHeight=100, endHeight=599
    expect(mockStartSync.mock.calls[0][0]).toMatchObject({
      startHeight: 100,
      endHeight: 599,
    });
    // Second chunk: startHeight=600, endHeight=1099
    expect(mockStartSync.mock.calls[1][0]).toMatchObject({
      startHeight: 600,
      endHeight: 1099,
    });

    expect(onChunk).toHaveBeenCalledTimes(2);

    // First callback: 500 processed, 500 remaining, 1 tx
    const firstChunk: ShieldedSyncResultRaw = onChunk.mock.calls[0][0];
    expect(firstChunk.processedBlocks).toBe(500);
    expect(firstChunk.remainingBlocks).toBe(500);
    expect(firstChunk.lastProcessedBlock).toBe(599);
    expect(firstChunk.transactions).toHaveLength(1);
    expect(firstChunk.transactions[0].id).toBe("tx-chunk1");

    // Second callback: 1000 processed, 0 remaining, 2 txs (cumulative)
    const secondChunk: ShieldedSyncResultRaw = onChunk.mock.calls[1][0];
    expect(secondChunk.processedBlocks).toBe(1000);
    expect(secondChunk.remainingBlocks).toBe(0);
    expect(secondChunk.lastProcessedBlock).toBe(1099);
    expect(secondChunk.transactions).toHaveLength(2);
    expect(secondChunk.transactions[0].id).toBe("tx-chunk1");
    expect(secondChunk.transactions[1].id).toBe("tx-chunk2");
  });

  it("cancels before the first chunk loop iteration", async () => {
    mockGetChainTip.mockResolvedValue(1000);

    let callCount = 0;
    const isCancelled = jest.fn(() => {
      callCount++;
      // First call (before getChainTip check) returns false,
      // second call (top of while loop) returns true
      return callCount > 1;
    });

    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled });

    expect(mockStartSync).not.toHaveBeenCalled();
    expect(onChunk).not.toHaveBeenCalled();
  });

  it("cancels after a chunk completes (between chunks)", async () => {
    mockGetChainTip.mockResolvedValue(1099);
    const stream1 = makeMockStream([], { blocksScanned: 500, elapsedMs: 100 });
    mockStartSync.mockResolvedValueOnce(stream1);

    const onChunk = jest.fn();
    let cancelCallCount = 0;
    const isCancelled = jest.fn((): boolean => {
      // Trace through isCancelled calls:
      // 1: startSyncJob line 105 -> false
      // 2: while-loop top (line 128) -> false
      // 3: syncChunk pre-read (line 224) -> false
      //    (stream.next() returns null immediately, while body never entered)
      // 4: syncChunk after-exhausted (line 241) -> false
      // 5: startSyncJob after-chunk (line 147) -> false (let onChunk fire)
      // 6: while-loop top again (line 128) -> true (cancel before 2nd chunk)
      cancelCallCount++;
      return cancelCallCount >= 6;
    });

    await startSyncJob({ ...baseArgs, maxBatchSize: 500 }, onChunk, { isCancelled });

    expect(mockStartSync).toHaveBeenCalledTimes(1);
    expect(onChunk).toHaveBeenCalledTimes(1);
  });

  it("cancels mid-stream within syncChunk and calls stream.cancel()", async () => {
    mockGetChainTip.mockResolvedValue(200);

    let nextCalls = 0;
    const stream = {
      next: jest.fn(async () => {
        nextCalls++;
        if (nextCalls === 1) return makeNativeTx();
        // Return another tx; but isCancelled will fire
        return makeNativeTx({ txid: "tx-2" });
      }),
      cancel: jest.fn(),
      stats: jest.fn(async () => ({ blocksScanned: 100, elapsedMs: 50 })),
    };
    mockStartSync.mockResolvedValue(stream);

    let callCount = 0;
    const isCancelled = jest.fn((): boolean => {
      // Trace:
      // 1: startSyncJob line 105 -> false
      // 2: while-loop top (line 128) -> false
      // 3: syncChunk pre-read (line 224) -> false
      //    stream.next() returns tx1 (enters while body)
      // 4: syncChunk mid-stream (line 233) -> TRUE (cancel here)
      callCount++;
      return callCount >= 4;
    });

    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled });

    expect(stream.cancel).toHaveBeenCalled();
    // When cancelled mid-stream, syncChunk returns 0 blocks, and then the
    // outer loop breaks due to isCancelled. onChunk should not be called.
    expect(onChunk).not.toHaveBeenCalled();
  });

  it("cancels before the first stream read within syncChunk", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const stream = makeMockStream([]);
    mockStartSync.mockResolvedValue(stream);

    let isCancelledCallCount = 0;
    const isCancelled = jest.fn(() => {
      isCancelledCallCount++;
      // false for: first check in startSyncJob, false for while-loop top check
      // true for: syncChunk's pre-read isCancelled check
      return isCancelledCallCount > 2;
    });

    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled });

    expect(stream.cancel).toHaveBeenCalled();
    expect(onChunk).not.toHaveBeenCalled();
  });

  it("cancels after stream is exhausted within syncChunk", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const stream = makeMockStream([makeNativeTx()]);
    mockStartSync.mockResolvedValue(stream);

    // We need isCancelled to return false until after stream.next() returns null,
    // then true on the "after stream exhausted" check in syncChunk.
    // Calls: (1) before getChainTip, (2) while-loop top, (3) syncChunk pre-read,
    // (4) after first next() returns tx, (5) after second next() returns null (exhausted check)
    let isCancelledCallCount = 0;
    const isCancelled = jest.fn(() => {
      isCancelledCallCount++;
      return isCancelledCallCount >= 5;
    });

    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled });

    expect(stream.cancel).toHaveBeenCalled();
    expect(onChunk).not.toHaveBeenCalled();
  });

  it("calls onActiveStream with stream and then null", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const stream = makeMockStream([]);
    mockStartSync.mockResolvedValue(stream);

    const onActiveStream = jest.fn();
    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, {
      isCancelled: () => false,
      onActiveStream,
    });

    // Called with the stream handle, then with null when done
    expect(onActiveStream).toHaveBeenCalledTimes(2);
    expect(onActiveStream).toHaveBeenNthCalledWith(1, stream);
    expect(onActiveStream).toHaveBeenNthCalledWith(2, null);
  });

  it("calls onActiveStream(null) even when syncChunk is cancelled mid-stream", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const stream = makeMockStream([makeNativeTx()]);
    mockStartSync.mockResolvedValue(stream);

    const onActiveStream = jest.fn();
    let callCount = 0;
    const isCancelled = jest.fn(() => {
      callCount++;
      // Cancel on the mid-stream check (after first next())
      return callCount > 2;
    });

    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, {
      isCancelled,
      onActiveStream,
    });

    // Ensure onActiveStream(null) was called for cleanup (finally block)
    const lastCall = onActiveStream.mock.calls[onActiveStream.mock.calls.length - 1];
    expect(lastCall[0]).toBeNull();
  });

  it("handles startBlockHeight equal to endHeight (single block)", async () => {
    const args: StartSyncJobArgs = { ...baseArgs, startBlockHeight: 200 };
    mockGetChainTip.mockResolvedValue(200);

    const tx = makeNativeTx({ blockHeight: 200 });
    const stream = makeMockStream([tx], { blocksScanned: 1, elapsedMs: 10 });
    mockStartSync.mockResolvedValue(stream);

    const onChunk = jest.fn();
    await startSyncJob(args, onChunk, { isCancelled: () => false });

    expect(mockStartSync).toHaveBeenCalledTimes(1);
    expect(mockStartSync.mock.calls[0][0]).toMatchObject({
      startHeight: 200,
      endHeight: 200,
    });

    expect(onChunk).toHaveBeenCalledTimes(1);
    const chunk: ShieldedSyncResultRaw = onChunk.mock.calls[0][0];
    expect(chunk.processedBlocks).toBe(1);
    expect(chunk.remainingBlocks).toBe(0);
    expect(chunk.lastProcessedBlock).toBe(200);
    expect(chunk.transactions).toHaveLength(1);
  });

  it("accumulates transactions across chunks", async () => {
    // 3 chunks: [100..199], [200..299], [300..399]
    const args: StartSyncJobArgs = { ...baseArgs, maxBatchSize: 100 };
    mockGetChainTip.mockResolvedValue(399);

    const tx1 = makeNativeTx({ txid: "tx-1" });
    const tx2 = makeNativeTx({ txid: "tx-2" });
    const tx3 = makeNativeTx({ txid: "tx-3" });

    const stream1 = makeMockStream([tx1], { blocksScanned: 100, elapsedMs: 50 });
    const stream2 = makeMockStream([], { blocksScanned: 100, elapsedMs: 50 });
    const stream3 = makeMockStream([tx2, tx3], { blocksScanned: 100, elapsedMs: 50 });

    mockStartSync
      .mockResolvedValueOnce(stream1)
      .mockResolvedValueOnce(stream2)
      .mockResolvedValueOnce(stream3);

    const onChunk = jest.fn();
    await startSyncJob(args, onChunk, { isCancelled: () => false });

    expect(onChunk).toHaveBeenCalledTimes(3);

    // Chunk 1: 1 tx total
    expect(onChunk.mock.calls[0][0].transactions).toHaveLength(1);
    // Chunk 2: still 1 tx total (no new txs)
    expect(onChunk.mock.calls[1][0].transactions).toHaveLength(1);
    // Chunk 3: 3 txs total
    expect(onChunk.mock.calls[2][0].transactions).toHaveLength(3);
    expect(onChunk.mock.calls[2][0].transactions.map((t: { id: string }) => t.id)).toEqual([
      "tx-1",
      "tx-2",
      "tx-3",
    ]);
  });

  it("converts amount and fee values to strings in mapped transactions", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const tx = makeNativeTx({
      fee: 99999n,
      orchardNotes: [{ amount: 123456n, memo: "test-memo", transferType: "incoming" }],
      saplingNotes: [{ amount: 789n, memo: "sap-memo", transferType: "internal" }],
    });
    const stream = makeMockStream([tx]);
    mockStartSync.mockResolvedValue(stream);

    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled: () => false });

    const mapped = onChunk.mock.calls[0][0].transactions[0];
    expect(typeof mapped.fee).toBe("string");
    expect(mapped.fee).toBe("99999");
    expect(mapped.decryptedData.orchard_outputs[0].amount).toBe("123456");
    expect(mapped.decryptedData.sapling_outputs[0].amount).toBe("789");
  });

  it("propagates nullifiers discovered in chunk N to chunk N+1 via knownNullifiers", async () => {
    // 2 chunks: [100..199] and [200..299]
    // Chunk 1 discovers a note with nullifier NF1.
    // Chunk 2 must receive NF1 in its knownNullifiers so it can detect if NF1 was spent.
    const NF1 = "aa".repeat(32);
    const args: StartSyncJobArgs = { ...baseArgs, maxBatchSize: 100 };
    mockGetChainTip.mockResolvedValue(299);

    const tx1 = makeNativeTx({
      txid: "tx-receive",
      orchardNotes: [{ amount: 100000n, memo: "", transferType: "incoming", nullifier: NF1 }],
      saplingNotes: [],
    });

    const stream1 = makeMockStream([tx1], { blocksScanned: 100, elapsedMs: 50 });
    const stream2 = makeMockStream([], {
      blocksScanned: 100,
      elapsedMs: 50,
      spentKnownNullifiers: [NF1],
    } as any);

    mockStartSync.mockResolvedValueOnce(stream1).mockResolvedValueOnce(stream2);

    const onChunk = jest.fn();
    await startSyncJob(args, onChunk, { isCancelled: () => false });

    expect(mockStartSync).toHaveBeenCalledTimes(2);

    // Chunk 2's call to startSync must include NF1 in knownNullifiers
    const chunk2Args = mockStartSync.mock.calls[1][0];
    expect(chunk2Args.knownNullifiers).toContain(NF1);
  });

  it("does not propagate outgoing note nullifiers to subsequent chunks", async () => {
    // Outgoing notes are not ours to spend — their nullifiers should not
    // be added to knownNullifiers.
    const args: StartSyncJobArgs = { ...baseArgs, maxBatchSize: 100 };
    mockGetChainTip.mockResolvedValue(299);

    const tx1 = makeNativeTx({
      txid: "tx-outgoing",
      orchardNotes: [
        { amount: 50000n, memo: "", transferType: "outgoing", nullifier: "ff".repeat(32) },
      ],
      saplingNotes: [],
    });

    const stream1 = makeMockStream([tx1], { blocksScanned: 100, elapsedMs: 50 });
    const stream2 = makeMockStream([], { blocksScanned: 100, elapsedMs: 50 });

    mockStartSync.mockResolvedValueOnce(stream1).mockResolvedValueOnce(stream2);

    const onChunk = jest.fn();
    await startSyncJob(args, onChunk, { isCancelled: () => false });

    // Chunk 2 should NOT receive the outgoing nullifier
    const chunk2Args = mockStartSync.mock.calls[1][0];
    if (chunk2Args.knownNullifiers) {
      expect(chunk2Args.knownNullifiers).not.toContain("ff".repeat(32));
    }
  });

  it("combines caller-provided knownNullifiers with discovered ones across chunks", async () => {
    const CALLER_NF = "11".repeat(32);
    const DISCOVERED_NF = "22".repeat(32);
    const args: StartSyncJobArgs = {
      ...baseArgs,
      maxBatchSize: 100,
      knownNullifiers: [CALLER_NF],
    };
    mockGetChainTip.mockResolvedValue(299);

    const tx1 = makeNativeTx({
      txid: "tx-new",
      orchardNotes: [
        { amount: 100000n, memo: "", transferType: "incoming", nullifier: DISCOVERED_NF },
      ],
      saplingNotes: [],
    });

    const stream1 = makeMockStream([tx1], { blocksScanned: 100, elapsedMs: 50 });
    const stream2 = makeMockStream([], { blocksScanned: 100, elapsedMs: 50 });

    mockStartSync.mockResolvedValueOnce(stream1).mockResolvedValueOnce(stream2);

    const onChunk = jest.fn();
    await startSyncJob(args, onChunk, { isCancelled: () => false });

    // Chunk 1 should have the caller-provided nullifier
    const chunk1Args = mockStartSync.mock.calls[0][0];
    expect(chunk1Args.knownNullifiers).toContain(CALLER_NF);

    // Chunk 2 should have BOTH the caller-provided AND the discovered nullifier
    const chunk2Args = mockStartSync.mock.calls[1][0];
    expect(chunk2Args.knownNullifiers).toContain(CALLER_NF);
    expect(chunk2Args.knownNullifiers).toContain(DISCOVERED_NF);
  });

  it("preserves isSpent flag from Rust (spent detection done server-side after Phase 5)", async () => {
    // Rust now emits transactions AFTER Phase 5 with correct isSpent flags.
    // Verify engine.ts faithfully passes them through to the onChunk output.
    const args: StartSyncJobArgs = { ...baseArgs };
    mockGetChainTip.mockResolvedValue(200);

    const tx1 = makeNativeTx({
      txid: "tx1-receive",
      orchardNotes: [
        {
          amount: 100000n,
          memo: "funding",
          transferType: "incoming",
          nullifier: "aa".repeat(32),
          isSpent: true, // Rust Phase 5 already set this
        },
      ],
      saplingNotes: [],
    });

    const tx2 = makeNativeTx({
      txid: "tx2-spend",
      orchardNotes: [
        {
          amount: 10000n,
          memo: "payment",
          transferType: "incoming",
          nullifier: "bb".repeat(32),
          isSpent: false,
        },
        {
          amount: 80000n,
          memo: "",
          transferType: "incoming",
          nullifier: "cc".repeat(32),
          isSpent: false,
        },
      ],
      saplingNotes: [],
    });

    const stream = makeMockStream([tx1, tx2]);
    mockStartSync.mockResolvedValue(stream);

    const onChunk = jest.fn();
    await startSyncJob(args, onChunk, { isCancelled: () => false });

    expect(onChunk).toHaveBeenCalledTimes(1);
    const chunk = onChunk.mock.calls[0][0];

    // TX1's isSpent=true from Rust must be preserved in the mapped output
    const mappedTx1 = chunk.transactions.find((t: { id: string }) => t.id === "tx1-receive");
    expect(mappedTx1.decryptedData.orchard_outputs[0].is_spent).toBe(true);

    // TX2's notes remain unspent
    const mappedTx2 = chunk.transactions.find((t: { id: string }) => t.id === "tx2-spend");
    expect(mappedTx2.decryptedData.orchard_outputs[0].is_spent).toBe(false);
    expect(mappedTx2.decryptedData.orchard_outputs[1].is_spent).toBe(false);
  });
});

// ── PCZT signing jobs ──────────────────────────────────────────────────
//
// buildTransactionJob / finalizeTransactionJob / broadcastTransactionJob all
// go through `getPcztModule`, which asserts the native addon exposes the four
// PCZT methods before use.

/** A raw parsePczt() result with string zatoshi values and `undefined` optionals. */
function makeRawPczt(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    global: {
      txVersion: 5,
      versionGroupId: 0x26a7270a,
      consensusBranchId: 0xc2d6d0b4,
      // fallbackLockTime intentionally omitted (undefined) -> normalised to null
      expiryHeight: 123456,
      coinType: 133,
      txModifiable: 0,
    },
    transparentInputs: [
      {
        prevoutTxid: new Uint8Array([1, 2, 3]),
        prevoutIndex: 0,
        // sequence intentionally omitted (undefined) -> normalised to null
        value: "100000", // decimal string -> normalised to bigint
        scriptPubKey: new Uint8Array([0x76, 0xa9]),
        sighashType: 1,
        derivation: { signingPath: "m/44'/133'/0'/0/0", pubkey: new Uint8Array([9]) },
      },
    ],
    transparentOutputs: [
      {
        value: 50000n, // already bigint -> passes through BigInt() unchanged
        scriptPubKey: new Uint8Array([0x00]),
        // derivation intentionally omitted (undefined) -> normalised to null
      },
    ],
    orchardBundle: {
      actions: [
        {
          cvNet: new Uint8Array([0]),
          nullifier: new Uint8Array([0]),
          rk: new Uint8Array([0]),
          spendRecipient: new Uint8Array([0]),
          spendValue: "70000", // string -> bigint
          spendRho: new Uint8Array([0]),
          spendRseed: new Uint8Array([0]),
          alpha: new Uint8Array([0]),
          signingPath: "m/44'/133'/0'",
          cmx: new Uint8Array([0]),
          ephemeralKey: new Uint8Array([0]),
          encCiphertext: new Uint8Array([0]),
          outCiphertext: new Uint8Array([0]),
          recipient: new Uint8Array([0]),
          value: 30000n, // bigint -> bigint
          rseed: new Uint8Array([0]),
          rcv: new Uint8Array([0]),
        },
      ],
      flags: 3,
      valueBalance: "-20000", // string -> bigint
      anchor: new Uint8Array([0xab]),
    },
    ...overrides,
  };
}

const buildArgs: Omit<BuildTransactionArgs, "requestId"> = {
  grpcUrl: "https://grpc.example.com",
  ufvk: "uview1test",
  network: "mainnet",
  seedFingerprint: "00".repeat(32),
  accountIndex: 0,
  feeZat: "10000",
  spends: [],
  transparentInputs: [],
  outputs: [{ address: "u1recipient", valueZat: "50000" }],
};

const nativeBuildResult = {
  pcztHex: "deadbeef",
  feeZat: "10000",
  anchorHeight: 2_000_000,
  nActionsOrchard: 2,
  nTransparentInputs: 1,
  nTransparentOutputs: 1,
};

describe("buildTransactionJob", () => {
  it("builds a PCZT, parses it, and returns the adapted result", async () => {
    mockBuildTransaction.mockResolvedValue(nativeBuildResult);
    mockParsePczt.mockReturnValue(makeRawPczt());

    const result = await buildTransactionJob(buildArgs);

    expect(mockBuildTransaction).toHaveBeenCalledWith(buildArgs);
    expect(mockParsePczt).toHaveBeenCalledWith("deadbeef");

    // Passthrough metadata from the native buildTransaction result.
    expect(result.pcztHex).toBe("deadbeef");
    expect(result.feeZat).toBe("10000");
    expect(result.anchorHeight).toBe(2_000_000);
    expect(result.nActionsOrchard).toBe(2);
    expect(result.nTransparentInputs).toBe(1);
    expect(result.nTransparentOutputs).toBe(1);
  });

  it("normalises value fields to bigint and undefined optionals to null (adaptPcztForSigner)", async () => {
    mockBuildTransaction.mockResolvedValue(nativeBuildResult);
    mockParsePczt.mockReturnValue(makeRawPczt());

    const { pcztTransaction } = await buildTransactionJob(buildArgs);

    // global.fallbackLockTime: undefined -> null
    expect(pcztTransaction.global.fallbackLockTime).toBeNull();

    // transparent input: string value -> bigint, undefined sequence -> null
    expect(pcztTransaction.transparentInputs[0].value).toBe(100000n);
    expect(pcztTransaction.transparentInputs[0].sequence).toBeNull();

    // transparent output: bigint value passes through, undefined derivation -> null
    expect(pcztTransaction.transparentOutputs[0].value).toBe(50000n);
    expect(pcztTransaction.transparentOutputs[0].derivation).toBeNull();

    // orchard bundle: valueBalance + action values normalised to bigint
    expect(pcztTransaction.orchardBundle?.valueBalance).toBe(-20000n);
    expect(pcztTransaction.orchardBundle?.actions[0].spendValue).toBe(70000n);
    expect(pcztTransaction.orchardBundle?.actions[0].value).toBe(30000n);
  });

  it("passes a null orchardBundle through unchanged", async () => {
    mockBuildTransaction.mockResolvedValue(nativeBuildResult);
    mockParsePczt.mockReturnValue(makeRawPczt({ orchardBundle: null }));

    const { pcztTransaction } = await buildTransactionJob(buildArgs);

    expect(pcztTransaction.orchardBundle).toBeNull();
  });

  it("propagates errors from the native buildTransaction", async () => {
    mockBuildTransaction.mockRejectedValue(new Error("proving failed"));
    await expect(buildTransactionJob(buildArgs)).rejects.toThrow("proving failed");
  });
});

describe("finalizeTransactionJob", () => {
  const finalizeArgs: Omit<FinalizeTransactionArgs, "requestId"> = {
    pczt: "cafebabe",
    orchardSignatures: ["aa".repeat(64)],
    transparentSignatures: ["bb".repeat(35)],
  };

  it("delegates to native.finalizeTransaction and returns its result", async () => {
    const finalizeResult = { txHex: "ff00", txid: "cc".repeat(32) };
    mockFinalizeTransaction.mockResolvedValue(finalizeResult);

    const result = await finalizeTransactionJob(finalizeArgs);

    expect(mockFinalizeTransaction).toHaveBeenCalledWith(finalizeArgs);
    expect(result).toBe(finalizeResult);
  });

  it("propagates errors from the native finalizeTransaction", async () => {
    mockFinalizeTransaction.mockRejectedValue(new Error("bad signature"));
    await expect(finalizeTransactionJob(finalizeArgs)).rejects.toThrow("bad signature");
  });
});

describe("broadcastTransactionJob", () => {
  it("delegates to native.broadcastTransaction and returns the txid", async () => {
    mockBroadcastTransaction.mockResolvedValue("dd".repeat(32));

    const txid = await broadcastTransactionJob("https://grpc.example.com", "abcd");

    expect(mockBroadcastTransaction).toHaveBeenCalledWith("https://grpc.example.com", "abcd");
    expect(txid).toBe("dd".repeat(32));
  });

  it("propagates errors from the native broadcastTransaction", async () => {
    mockBroadcastTransaction.mockRejectedValue(new Error("gRPC rejected tx"));
    await expect(broadcastTransactionJob("url", "abcd")).rejects.toThrow("gRPC rejected tx");
  });
});

describe("getPcztModule guard (via jobs)", () => {
  it("throws a descriptive error listing the missing PCZT method(s)", async () => {
    const original = mockNativeModule.finalizeTransaction;
    delete mockNativeModule.finalizeTransaction;
    try {
      await expect(broadcastTransactionJob("url", "abcd")).rejects.toThrow(
        /missing PCZT method\(s\): finalizeTransaction/,
      );
    } finally {
      mockNativeModule.finalizeTransaction = original;
    }
  });
});

// ── mapNativeTx — Ironwood notes ───────────────────────────────────────

describe("mapNativeTx (Ironwood notes via startSyncJob)", () => {
  it("maps ironwoodNotes to ironwood_outputs in the raw transaction", async () => {
    mockGetChainTip.mockResolvedValue(200);
    const tx = makeNativeTx({
      ironwoodNotes: [
        {
          amount: 700_000n,
          memo: "iw-memo",
          transferType: "incoming",
          nullifier: "aa".repeat(32),
          rho: "bb".repeat(32),
          rseed: "cc".repeat(32),
          cmx: "dd".repeat(32),
          position: "99",
        },
      ],
    });
    const stream = makeMockStream([tx]);
    mockStartSync.mockResolvedValue(stream);

    const onChunk = jest.fn();
    await startSyncJob(
      {
        grpcUrl: "https://grpc.example.com",
        network: "main",
        viewingKey: "vk",
        startBlockHeight: 100,
        maxBatchSize: 500,
      },
      onChunk,
      { isCancelled: () => false },
    );

    const mapped = onChunk.mock.calls[0][0].transactions[0];
    expect(mapped.decryptedData).toHaveProperty("ironwood_outputs");
    expect(mapped.decryptedData.ironwood_outputs).toHaveLength(1);
    const iwOut = mapped.decryptedData.ironwood_outputs[0];
    expect(iwOut.amount).toBe("700000");
    expect(iwOut.memo).toBe("iw-memo");
    expect(iwOut.transfer_type).toBe("incoming");
    expect(iwOut.nullifier).toBe("aa".repeat(32));
  });

  it("omits ironwood_outputs key when ironwoodNotes is absent or empty", async () => {
    mockGetChainTip.mockResolvedValue(200);
    // tx without ironwoodNotes at all
    const txNoIw = makeNativeTx({ ironwoodNotes: undefined });
    // tx with empty ironwoodNotes
    const txEmptyIw = makeNativeTx({ txid: "tx-empty-iw", ironwoodNotes: [] });

    const stream = makeMockStream([txNoIw, txEmptyIw]);
    mockStartSync.mockResolvedValue(stream);

    const onChunk = jest.fn();
    await startSyncJob(
      {
        grpcUrl: "https://grpc.example.com",
        network: "main",
        viewingKey: "vk",
        startBlockHeight: 100,
        maxBatchSize: 500,
      },
      onChunk,
      { isCancelled: () => false },
    );

    const txs = onChunk.mock.calls[0][0].transactions;
    expect(txs[0].decryptedData).not.toHaveProperty("ironwood_outputs");
    expect(txs[1].decryptedData).not.toHaveProperty("ironwood_outputs");
  });
});

// ── buildIronwoodTransactionJob ────────────────────────────────────────

describe("buildIronwoodTransactionJob", () => {
  const nativeIwBuildResult = {
    pcztHex: "cafebeef",
    feeZat: "15000",
    anchorHeight: 3_000_000,
    nActionsIronwood: 2,
    nTransparentInputs: 0,
    nTransparentOutputs: 0,
  };

  const iwBuildArgs: Omit<BuildIronwoodTransactionArgs, "requestId"> = {
    grpcUrl: "https://grpc.example.com",
    ufvk: "uview1test",
    seedFingerprint: "00".repeat(32),
    accountIndex: 0,
    feeZat: "15000",
    spends: [],
    transparentInputs: [],
    outputs: [{ address: "u1recipient", valueZat: "50000" }],
  };

  it("calls native.buildIronwoodTransaction, parsePczt, and returns the adapted result", async () => {
    mockBuildIronwoodTransaction.mockResolvedValue(nativeIwBuildResult);
    mockParsePczt.mockReturnValue(makeRawPczt());

    const result = await buildIronwoodTransactionJob(iwBuildArgs);

    expect(mockBuildIronwoodTransaction).toHaveBeenCalledWith(iwBuildArgs);
    expect(mockParsePczt).toHaveBeenCalledWith("cafebeef");

    expect(result.pcztHex).toBe("cafebeef");
    expect(result.feeZat).toBe("15000");
    expect(result.anchorHeight).toBe(3_000_000);
    expect(result.nActionsIronwood).toBe(2);
    expect(result.nTransparentInputs).toBe(0);
    expect(result.nTransparentOutputs).toBe(0);
  });

  it("normalises the PCZT result via adaptPcztForSigner (same path as buildTransactionJob)", async () => {
    mockBuildIronwoodTransaction.mockResolvedValue(nativeIwBuildResult);
    mockParsePczt.mockReturnValue(makeRawPczt());

    const { pcztTransaction } = await buildIronwoodTransactionJob(iwBuildArgs);

    // Verify that adaptPcztForSigner ran (BigNumber normalisation is its signature)
    expect(pcztTransaction.transparentInputs[0].value).toBe(100000n);
    expect(pcztTransaction.orchardBundle?.valueBalance).toBe(-20000n);
  });

  it("propagates errors from native.buildIronwoodTransaction", async () => {
    mockBuildIronwoodTransaction.mockRejectedValue(new Error("proving failed (ironwood)"));
    await expect(buildIronwoodTransactionJob(iwBuildArgs)).rejects.toThrow(
      "proving failed (ironwood)",
    );
  });
});
