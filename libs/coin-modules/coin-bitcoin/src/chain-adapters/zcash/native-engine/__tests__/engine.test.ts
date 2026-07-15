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

jest.mock("@ledgerhq/zcash-utils", () => ({
  __esModule: true,
  getChainTip: (...args: unknown[]) => mockGetChainTip(...(args as [string])),
  findBlockHeight: (...args: unknown[]) => mockFindBlockHeight(...(args as [string, number])),
  startSync: (...args: unknown[]) => mockStartSync(...(args as [unknown])),
}));

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
  type StartSyncJobArgs,
} from "../engine";

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

  it("short-circuits with zero results when already at tip (startBlockHeight > endHeight)", async () => {
    mockGetChainTip.mockResolvedValue(50); // endHeight < startBlockHeight
    const onChunk = jest.fn();
    await startSyncJob(baseArgs, onChunk, { isCancelled: () => false });

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onChunk).toHaveBeenCalledWith({
      processedBlocks: 0,
      remainingBlocks: 0,
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
        orchardOnly: true,
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
