import BigNumber from "bignumber.js";
import { rehydrateTransaction, rehydrateSyncResult } from "../rehydrate";
import type { ShieldedTransactionRaw, ShieldedSyncResultRaw } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRawTx(overrides: Partial<ShieldedTransactionRaw> = {}): ShieldedTransactionRaw {
  return {
    id: "txid-abc",
    hex: "deadbeef",
    blockHeight: 2_000_000,
    blockHash: "00000000006e7fa4a753e2e26c6d6e5b66bee5fef0ab0e39e34e2ce3e7e7e7e7",
    timestamp: 1_700_000_000,
    fee: "10000",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// rehydrateTransaction
// ---------------------------------------------------------------------------

describe("rehydrateTransaction", () => {
  it("converts scalar fields and fee to BigNumber", () => {
    const raw = makeRawTx();
    const result = rehydrateTransaction(raw);

    expect(result.id).toBe(raw.id);
    expect(result.hex).toBe(raw.hex);
    expect(result.blockHeight).toBe(raw.blockHeight);
    expect(result.blockHash).toBe(raw.blockHash);
    expect(result.timestamp).toBe(raw.timestamp);
    expect(result.fee).toBeInstanceOf(BigNumber);
    expect(result.fee.toFixed()).toBe("10000");
  });

  it("omits decryptedData when absent from raw", () => {
    const raw = makeRawTx();
    const result = rehydrateTransaction(raw);

    expect(result.decryptedData).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(result, "decryptedData")).toBe(false);
  });

  it("rehydrates decryptedData with orchard and sapling outputs", () => {
    const raw = makeRawTx({
      decryptedData: {
        orchard_outputs: [
          { amount: "500000", memo: "hello", transfer_type: "incoming" },
          { amount: "200000", memo: "", transfer_type: "outgoing" },
        ],
        sapling_outputs: [{ amount: "100000", memo: "memo-sap", transfer_type: "internal" }],
      },
    });

    const result = rehydrateTransaction(raw);

    expect(result.decryptedData).toEqual({
      orchard_outputs: [
        { amount: new BigNumber("500000"), memo: "hello", transfer_type: "incoming" },
        { amount: new BigNumber("200000"), memo: "", transfer_type: "outgoing" },
      ],
      sapling_outputs: [
        { amount: new BigNumber("100000"), memo: "memo-sap", transfer_type: "internal" },
      ],
    });
  });

  it("handles empty orchard and sapling arrays in decryptedData", () => {
    const raw = makeRawTx({
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [],
      },
    });

    const result = rehydrateTransaction(raw);

    expect(result.decryptedData).toEqual({ orchard_outputs: [], sapling_outputs: [] });
  });

  it("handles a zero fee", () => {
    const raw = makeRawTx({ fee: "0" });
    const result = rehydrateTransaction(raw);

    expect(result.fee.isZero()).toBe(true);
  });

  it("handles a very large fee (> Number.MAX_SAFE_INTEGER)", () => {
    const largeFee = "99999999999999999999";
    const raw = makeRawTx({ fee: largeFee });
    const result = rehydrateTransaction(raw);

    expect(result.fee.toFixed()).toBe(largeFee);
    expect(result.fee.isFinite()).toBe(true);
  });

  it("handles very large output amounts", () => {
    const largeAmount = "123456789012345678901234567890";
    const raw = makeRawTx({
      decryptedData: {
        orchard_outputs: [{ amount: largeAmount, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    });

    const result = rehydrateTransaction(raw);
    expect(result.decryptedData!.orchard_outputs[0].amount.toFixed()).toBe(largeAmount);
  });

  it("preserves all scalar fields without mutation of the original raw object", () => {
    const raw = makeRawTx({
      decryptedData: {
        orchard_outputs: [{ amount: "42", memo: "m", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    });
    const rawCopy = JSON.parse(JSON.stringify(raw));

    rehydrateTransaction(raw);

    // The raw input should not have been mutated
    expect(raw).toEqual(rawCopy);
  });
});

// ---------------------------------------------------------------------------
// rehydrateSyncResult
// ---------------------------------------------------------------------------

describe("rehydrateSyncResult", () => {
  it("maps processedBlocks and remainingBlocks directly", () => {
    const raw: ShieldedSyncResultRaw = {
      processedBlocks: 500,
      remainingBlocks: 1500,
      transactions: [],
    };

    const result = rehydrateSyncResult(raw);

    expect(result.processedBlocks).toBe(500);
    expect(result.remainingBlocks).toBe(1500);
  });

  it("includes lastProcessedBlock when present", () => {
    const raw: ShieldedSyncResultRaw = {
      processedBlocks: 10,
      remainingBlocks: 90,
      lastProcessedBlock: 2_100_000,
      transactions: [],
    };

    const result = rehydrateSyncResult(raw);

    expect(result.lastProcessedBlock).toBe(2_100_000);
  });

  it("omits lastProcessedBlock key when undefined in raw", () => {
    const raw: ShieldedSyncResultRaw = {
      processedBlocks: 10,
      remainingBlocks: 90,
      transactions: [],
    };

    const result = rehydrateSyncResult(raw);

    expect(result.lastProcessedBlock).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(result, "lastProcessedBlock")).toBe(false);
  });

  it("includes lastProcessedBlock when value is 0 (falsy but defined)", () => {
    const raw: ShieldedSyncResultRaw = {
      processedBlocks: 0,
      remainingBlocks: 100,
      lastProcessedBlock: 0,
      transactions: [],
    };

    const result = rehydrateSyncResult(raw);

    expect(result.lastProcessedBlock).toBe(0);
    expect(Object.prototype.hasOwnProperty.call(result, "lastProcessedBlock")).toBe(true);
  });

  it("returns an empty transactions array when raw has none", () => {
    const raw: ShieldedSyncResultRaw = {
      processedBlocks: 0,
      remainingBlocks: 0,
      transactions: [],
    };

    const result = rehydrateSyncResult(raw);

    expect(result.transactions).toEqual([]);
  });

  it("rehydrates each transaction in the array", () => {
    const raw: ShieldedSyncResultRaw = {
      processedBlocks: 2,
      remainingBlocks: 8,
      lastProcessedBlock: 100,
      transactions: [
        makeRawTx({ id: "tx1", fee: "1000" }),
        makeRawTx({
          id: "tx2",
          fee: "2000",
          decryptedData: {
            orchard_outputs: [{ amount: "300", memo: "", transfer_type: "incoming" }],
            sapling_outputs: [{ amount: "400", memo: "hi", transfer_type: "outgoing" }],
          },
        }),
      ],
    };

    const result = rehydrateSyncResult(raw);

    expect(result.transactions).toHaveLength(2);

    // First transaction: no decryptedData
    expect(result.transactions[0].id).toBe("tx1");
    expect(result.transactions[0].fee).toBeInstanceOf(BigNumber);
    expect(result.transactions[0].fee.toFixed()).toBe("1000");
    expect(result.transactions[0].decryptedData).toBeUndefined();

    // Second transaction: with decryptedData
    expect(result.transactions[1].id).toBe("tx2");
    expect(result.transactions[1].fee.toFixed()).toBe("2000");
    expect(result.transactions[1].decryptedData!.orchard_outputs[0].amount.toFixed()).toBe("300");
    expect(result.transactions[1].decryptedData!.sapling_outputs[0].amount.toFixed()).toBe("400");
    expect(result.transactions[1].decryptedData!.sapling_outputs[0].memo).toBe("hi");
  });

  it("handles a large batch of transactions", () => {
    const txCount = 100;
    const transactions = Array.from({ length: txCount }, (_, i) =>
      makeRawTx({ id: `tx-${i}`, fee: String(i * 100) }),
    );

    const raw: ShieldedSyncResultRaw = {
      processedBlocks: txCount,
      remainingBlocks: 0,
      transactions,
    };

    const result = rehydrateSyncResult(raw);

    expect(result.transactions).toHaveLength(txCount);
    result.transactions.forEach((tx, i) => {
      expect(tx.id).toBe(`tx-${i}`);
      expect(tx.fee).toBeInstanceOf(BigNumber);
      expect(tx.fee.toFixed()).toBe(String(i * 100));
    });
  });

  it("does not mutate the input raw object", () => {
    const raw: ShieldedSyncResultRaw = {
      processedBlocks: 1,
      remainingBlocks: 0,
      lastProcessedBlock: 42,
      transactions: [makeRawTx({ fee: "999" })],
    };
    const rawCopy = JSON.parse(JSON.stringify(raw));

    rehydrateSyncResult(raw);

    expect(raw).toEqual(rawCopy);
  });
});
