import type { APITokenTransfer, APITransactionType } from "../network/types";
import { getBlock } from "./getBlock";

// ---------------------------------------------------------------------------
// Network mock
// Using the same lazy-reference pattern as the XRP reference tests so that the
// `jest.mock` factory (which is hoisted) can reference variables declared below.
// ---------------------------------------------------------------------------

const mockGetBlockByLevel = jest.fn();
const mockFetchBlockTransactions = jest.fn();
const mockFetchBlockTokenTransfers = jest.fn();

jest.mock("../network", () => ({
  tzkt: { getBlockByLevel: (...args: unknown[]) => mockGetBlockByLevel(...args) },
  fetchBlockTransactions: (...args: unknown[]) => mockFetchBlockTransactions(...args),
  fetchBlockTokenTransfers: (...args: unknown[]) => mockFetchBlockTokenTransfers(...args),
}));

// ---------------------------------------------------------------------------
// Test-data factories
// ---------------------------------------------------------------------------

function makeBlock(level = 5_000_000, hash = "BLockHash123", timestamp = "2024-01-01T00:00:00Z") {
  return { level, hash, timestamp } as any;
}

function makeTx(overrides: Partial<APITransactionType> = {}): APITransactionType {
  return {
    id: 1,
    hash: "opHash1",
    type: "transaction",
    amount: 0,
    sender: { address: "tz1Sender" },
    target: { address: "tz1Target" },
    initiator: null,
    counter: 1,
    level: 5_000_000,
    block: "BLockHash123",
    timestamp: "2024-01-01T00:00:00Z",
    bakerFee: 0,
    storageFee: 0,
    allocationFee: 0,
    status: "applied",
    ...overrides,
  } as APITransactionType;
}

function makeTokenTransfer(overrides: Partial<APITokenTransfer> = {}): APITokenTransfer {
  return {
    id: 100,
    level: 5_000_000,
    timestamp: "2024-01-01T00:00:00Z",
    token: {
      id: 1,
      contract: { address: "KT1FATezosContract" },
      tokenId: "0",
      standard: "fa1.2",
      metadata: { name: "TezToken", symbol: "TZT" },
    },
    from: { address: "tz1Sender" },
    to: { address: "tz1Target" },
    amount: "500",
    transactionId: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Default: empty transactions and token transfers so tests only set what they need
  mockFetchBlockTransactions.mockResolvedValue([]);
  mockFetchBlockTokenTransfers.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// 1. Block info mapping and guard
// ---------------------------------------------------------------------------

describe("block info and guard", () => {
  it("maps level, hash, timestamp, and parent into Block.info", async () => {
    // Given
    const level = 7_000_000;
    mockGetBlockByLevel.mockResolvedValueOnce(makeBlock(level, "BLHash", "2025-06-15T12:00:00Z"));
    mockGetBlockByLevel.mockResolvedValueOnce(
      makeBlock(level - 1, "BLParentHash", "2025-06-15T11:59:52Z"),
    );

    // When
    const result = await getBlock(level);

    // Then
    expect(mockGetBlockByLevel).toHaveBeenCalledWith(level);
    expect(mockGetBlockByLevel).toHaveBeenCalledWith(level - 1);
    expect(result.info).toEqual({
      height: level,
      hash: "BLHash",
      time: new Date("2025-06-15T12:00:00Z"),
      parent: { height: level - 1, hash: "BLParentHash" },
    });
  });

  it("throws for height = 0 without any network calls", async () => {
    // When / Then
    await expect(getBlock(0)).rejects.toThrow("getBlock: height must be a positive integer, got 0");
    expect(mockGetBlockByLevel).not.toHaveBeenCalled();
    expect(mockFetchBlockTransactions).not.toHaveBeenCalled();
    expect(mockFetchBlockTokenTransfers).not.toHaveBeenCalled();
  });

  it("throws for negative height without any network calls", async () => {
    // When / Then
    await expect(getBlock(-3)).rejects.toThrow(
      "getBlock: height must be a positive integer, got -3",
    );
    expect(mockGetBlockByLevel).not.toHaveBeenCalled();
  });

  it("returns an empty transactions array when the block has no operations", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions).toEqual([]);
  });

  it("silently skips a transaction with no hash (covers !tx.hash branch and tx.id && tx.hash false branch)", async () => {
    // Given – one tx without a hash and one valid tx
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ hash: undefined as unknown as string, id: 5, amount: 500_000 }),
      makeTx({ id: 2, hash: "validHash", amount: 1_000_000 }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – only the tx with a valid hash is included
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].hash).toBe("validHash");
  });

  it("excludes a no-id transaction from the token-transfer lookup (covers tx.id falsy branch)", async () => {
    // Given – tx without id cannot be registered in txIdToHash
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ id: undefined as unknown as number, hash: "noIdHash", amount: 2_000_000 }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – the tx still appears (it has a hash), but no txIdToHash entry was created
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].hash).toBe("noIdHash");
  });
});

// ---------------------------------------------------------------------------
// 2. Native XTZ transfers
// ---------------------------------------------------------------------------

describe("native XTZ operations", () => {
  it("produces outgoing and incoming operations for a non-zero XTZ transfer", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ amount: 1_000_000, sender: { address: "tz1Alice" }, target: { address: "tz1Bob" } }),
    ]);

    // When
    const result = await getBlock(5_000_000);
    const tx = result.transactions[0];

    // Then
    expect(tx.operations).toHaveLength(2);
    expect(tx.operations[0]).toEqual({
      type: "transfer",
      address: "tz1Alice",
      peer: "tz1Bob",
      asset: { type: "native", name: "XTZ" },
      amount: -1_000_000n,
    });
    expect(tx.operations[1]).toEqual({
      type: "transfer",
      address: "tz1Bob",
      peer: "tz1Alice",
      asset: { type: "native", name: "XTZ" },
      amount: 1_000_000n,
    });
  });

  it("produces no operations for a zero-amount transaction (e.g. delegation reveal)", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([makeTx({ amount: 0 })]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("produces only an incoming operation when sender is null, with no peer field", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ amount: 500_000, sender: null, target: { address: "tz1Receiver" } }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then — peer must be absent (not set to undefined) when the counterparty is unknown
    expect(result.transactions[0].operations).toHaveLength(1);
    expect(result.transactions[0].operations[0]).toEqual({
      type: "transfer",
      address: "tz1Receiver",
      asset: { type: "native", name: "XTZ" },
      amount: 500_000n,
    });
    expect(result.transactions[0].operations[0]).not.toHaveProperty("peer");
  });

  it("produces only an outgoing operation when target is null, with no peer field", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ amount: 300_000, sender: { address: "tz1Sender" }, target: null }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then — peer must be absent (not set to undefined) when the counterparty is unknown
    expect(result.transactions[0].operations).toHaveLength(1);
    expect(result.transactions[0].operations[0]).toEqual({
      type: "transfer",
      address: "tz1Sender",
      asset: { type: "native", name: "XTZ" },
      amount: -300_000n,
    });
    expect(result.transactions[0].operations[0]).not.toHaveProperty("peer");
  });

  it("skips a transaction that has no hash", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ hash: undefined, amount: 1_000 }),
      makeTx({ id: 2, hash: "opHash2", amount: 2_000 }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then — only the tx with a hash produces a BlockTransaction
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].hash).toBe("opHash2");
  });
});

// ---------------------------------------------------------------------------
// 3. Fees and feesPayer
// ---------------------------------------------------------------------------

describe("fee computation and fee payer", () => {
  it("sums bakerFee, storageFee, and allocationFee as the total fees", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ bakerFee: 400, storageFee: 100, allocationFee: 50 }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].fees).toBe(550n);
  });

  it("uses sender as feesPayer for a top-level (non-contract) operation", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ bakerFee: 400, initiator: null, sender: { address: "tz1FeePayer" } }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].feesPayer).toBe("tz1FeePayer");
  });

  it("uses initiator as feesPayer when the operation is contract-initiated", async () => {
    // Given – top-level op has bakerFee > 0 and an initiator (the real fee payer)
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({
        bakerFee: 600,
        initiator: { address: "tz1RealUser" },
        sender: { address: "KT1Contract" },
      }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].feesPayer).toBe("tz1RealUser");
  });

  it("omits feesPayer when both sender and initiator are null", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([makeTx({ sender: null, initiator: null })]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].feesPayer).toBeUndefined();
  });

  it("treats null/undefined fee fields as zero (covers ?? 0 fallback branches)", async () => {
    // Given – a transaction where none of the fee fields are populated (possible for
    // implicit/internal ops that the protocol injects without explicit fees).
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({
        bakerFee: undefined as unknown as number,
        storageFee: undefined as unknown as number,
        allocationFee: undefined as unknown as number,
        amount: 1_000_000,
      }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – all three ?? 0 branches are exercised; total fees must be 0n
    expect(result.transactions[0].fees).toBe(0n);
  });
});

// ---------------------------------------------------------------------------
// 4. Failed transactions
// ---------------------------------------------------------------------------

describe("failed transactions", () => {
  it("marks a transaction as failed when status is 'failed'", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([makeTx({ status: "failed", amount: 1_000_000 })]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].failed).toBe(true);
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("marks a transaction as failed when status is 'backtracked'", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ status: "backtracked", amount: 1_000_000 }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].failed).toBe(true);
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("marks the whole batch as failed when any op in the group is not applied", async () => {
    // Given – two ops share the same hash; the second one backtracked
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ id: 1, hash: "opBatch", amount: 1_000, status: "applied" }),
      makeTx({ id: 2, hash: "opBatch", amount: 2_000, status: "backtracked" }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].failed).toBe(true);
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("treats operations with no status field as succeeded", async () => {
    // Given – status is undefined (some TzKT responses omit it)
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([makeTx({ status: undefined, amount: 100_000 })]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].failed).toBe(false);
    expect(result.transactions[0].operations).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 5. Batch and internal operations
// ---------------------------------------------------------------------------

describe("batch and internal operations", () => {
  it("merges multiple ops sharing the same hash into a single BlockTransaction", async () => {
    // Given – two operations in a batch
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ id: 1, hash: "opBatch", amount: 1_000_000, bakerFee: 400, storageFee: 0 }),
      makeTx({
        id: 2,
        hash: "opBatch",
        amount: 2_000_000,
        bakerFee: 0,
        storageFee: 100,
        sender: { address: "tz1Second" },
        target: { address: "tz1ThirdParty" },
      }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – one BlockTransaction with both ops' ops and combined fees
    expect(result.transactions).toHaveLength(1);
    const tx = result.transactions[0];
    expect(tx.hash).toBe("opBatch");
    expect(tx.fees).toBe(500n); // 400 + 0 + 0 + 0 + 100 + 0
    expect(tx.operations).toHaveLength(4); // sender+target for each of the 2 ops
  });

  it("uses the bakerFee-bearing op to determine feesPayer in a batch", async () => {
    // Given – first op has no bakerFee; second op has bakerFee > 0
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ id: 1, hash: "opBatch", bakerFee: 0, sender: { address: "KT1Contract" } }),
      makeTx({ id: 2, hash: "opBatch", bakerFee: 500, sender: { address: "tz1ActualPayer" } }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions[0].feesPayer).toBe("tz1ActualPayer");
  });

  it("two distinct hashes produce two BlockTransactions", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ id: 1, hash: "opHash1" }),
      makeTx({ id: 2, hash: "opHash2" }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions.map(t => t.hash)).toEqual(
      expect.arrayContaining(["opHash1", "opHash2"]),
    );
  });
});

// ---------------------------------------------------------------------------
// 6. FA token transfers
// ---------------------------------------------------------------------------

describe("FA token transfers", () => {
  it("appends token ops to the matching native BlockTransaction", async () => {
    // Given – native tx id=1, token transfer transactionId=1
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ id: 1, hash: "opHash1", amount: 100_000, bakerFee: 400 }),
    ]);
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({ transactionId: 1, amount: "500" }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – one BlockTransaction with 2 native ops + 2 token ops
    expect(result.transactions).toHaveLength(1);
    const tx = result.transactions[0];
    expect(tx.operations).toHaveLength(4);
    const tokenOps = tx.operations.filter(
      op => op.type === "transfer" && "asset" in op && (op as any).asset.type === "token",
    );
    expect(tokenOps).toHaveLength(2);
  });

  it("does NOT append token ops to a failed BlockTransaction", async () => {
    // Given – parent tx failed; token transfer would be meaningless
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockResolvedValue([
      makeTx({ id: 1, hash: "opFailed", amount: 100_000, status: "failed" }),
    ]);
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({ transactionId: 1, amount: "500" }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – failed tx has no operations at all
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].failed).toBe(true);
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("creates a standalone BlockTransaction for a token transfer with no parent tx", async () => {
    // Given – token transfer with transactionId=99 but no matching native tx
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({ id: 200, transactionId: 99, amount: "1000" }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – one standalone BlockTransaction with 2 token ops
    expect(result.transactions).toHaveLength(1);
    const tx = result.transactions[0];
    expect(tx.hash).toBe("txid-99"); // synthetic but unique, derived from transactionId
    expect(tx.failed).toBe(false);
    expect(tx.fees).toBe(0n);
    expect(tx.operations).toHaveLength(2);
  });

  it("groups multiple token transfers sharing the same transactionId into one standalone entry", async () => {
    // Given – two token transfers both orphaned but from the same parent id=42
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({ id: 1, transactionId: 42, amount: "100" }),
      makeTokenTransfer({
        id: 2,
        transactionId: 42,
        amount: "200",
        from: { address: "tz1AnotherSender" },
        to: { address: "tz1AnotherReceiver" },
      }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – merged into one standalone BlockTransaction with 4 ops (2 per transfer)
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].operations).toHaveLength(4);
  });

  it("creates a separate standalone entry for each token transfer without a transactionId", async () => {
    // Given – two protocol-level transfers with no transactionId
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({ id: 1, transactionId: undefined, amount: "100" }),
      makeTokenTransfer({ id: 2, transactionId: undefined, amount: "200" }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – each gets its own BlockTransaction
    expect(result.transactions).toHaveLength(2);
  });

  it("emits only an incoming operation for a minting event (no `from`), with no peer field", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({
        transactionId: undefined,
        from: null,
        to: { address: "tz1Receiver" },
        amount: "750",
      }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then — peer must be absent when mint has no sender
    expect(result.transactions[0].operations).toHaveLength(1);
    expect(result.transactions[0].operations[0]).not.toHaveProperty("peer");
    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      address: "tz1Receiver",
      amount: 750n,
    });
  });

  it("emits only an outgoing operation for a burning event (no `to`), with no peer field", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({
        transactionId: undefined,
        from: { address: "tz1Burner" },
        to: null,
        amount: "300",
      }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then — peer must be absent when burn has no receiver
    expect(result.transactions[0].operations).toHaveLength(1);
    expect(result.transactions[0].operations[0]).not.toHaveProperty("peer");
    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      address: "tz1Burner",
      amount: -300n,
    });
  });

  it("produces no operations for a zero-amount FA token transfer", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({ transactionId: undefined, amount: "0" }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then – zero-amount transfer is silently discarded
    expect(result.transactions).toHaveLength(0);
  });

  it("encodes assetReference as 'contract:tokenId' to uniquely identify FA2 tokens", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({
        transactionId: undefined,
        token: {
          id: 5,
          contract: { address: "KT1SpecificContract" },
          tokenId: "7",
          standard: "fa2",
          metadata: { name: "MyFA2Token", symbol: "MFT" },
        },
        amount: "100",
      }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then — tokenId "7" must be part of the reference so different FA2 tokens under
    // the same contract are not conflated.
    const op = result.transactions[0].operations[0] as any;
    expect(op.asset).toMatchObject({
      type: "token",
      assetReference: "KT1SpecificContract:7",
      name: "MyFA2Token",
    });
  });

  it("falls back to symbol as token name when metadata name is absent", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockResolvedValue([
      makeTokenTransfer({
        transactionId: undefined,
        token: {
          id: 6,
          contract: { address: "KT1NoName" },
          tokenId: "0",
          standard: "fa1.2",
          metadata: { symbol: "NNT" }, // no name field
        },
        amount: "50",
      }),
    ]);

    // When
    const result = await getBlock(5_000_000);

    // Then
    const op = result.transactions[0].operations[0] as any;
    expect(op.asset.name).toBe("NNT");
  });
});

// ---------------------------------------------------------------------------
// 7. Network call contract
// ---------------------------------------------------------------------------

describe("network calls", () => {
  it("issues all four network calls with the correct heights", async () => {
    // Given
    const height = 6_000_000;
    mockGetBlockByLevel.mockResolvedValue(makeBlock(height));

    // When
    await getBlock(height);

    // Then – getBlockByLevel is called once for the block and once for the parent
    expect(mockGetBlockByLevel).toHaveBeenCalledTimes(2);
    expect(mockGetBlockByLevel).toHaveBeenCalledWith(height);
    expect(mockGetBlockByLevel).toHaveBeenCalledWith(height - 1);
    expect(mockFetchBlockTransactions).toHaveBeenCalledTimes(1);
    expect(mockFetchBlockTransactions).toHaveBeenCalledWith(height);
    expect(mockFetchBlockTokenTransfers).toHaveBeenCalledTimes(1);
    expect(mockFetchBlockTokenTransfers).toHaveBeenCalledWith(height);
  });

  it("propagates errors from getBlockByLevel", async () => {
    // Given
    mockGetBlockByLevel.mockRejectedValue(new Error("block fetch failed"));

    // When / Then
    await expect(getBlock(1_000_000)).rejects.toThrow("block fetch failed");
  });

  it("propagates errors from fetchBlockTransactions", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTransactions.mockRejectedValue(new Error("tx fetch failed"));

    // When / Then
    await expect(getBlock(1_000_000)).rejects.toThrow("tx fetch failed");
  });

  it("propagates errors from fetchBlockTokenTransfers", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue(makeBlock());
    mockFetchBlockTokenTransfers.mockRejectedValue(new Error("token fetch failed"));

    // When / Then
    await expect(getBlock(1_000_000)).rejects.toThrow("token fetch failed");
  });
});
