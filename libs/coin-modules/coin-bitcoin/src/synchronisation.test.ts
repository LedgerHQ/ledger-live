jest.mock("./wallet-btc", () => {
  const { BigNumber } = require("bignumber.js");
  const mock = {
    generateAccount: jest.fn(),
    syncAccount: jest.fn(),
    getAccountBalance: jest.fn().mockResolvedValue(new BigNumber(0)),
    getAccountTransactions: jest.fn().mockResolvedValue({ txs: [] }),
    getAccountUnspentUtxos: jest.fn().mockResolvedValue([]),
  };
  return { __esModule: true, default: mock, DerivationModes: {} };
});

import {
  removeReplaced,
  getTxType,
  convertShieldedTransactionsToOperations,
  reduceShieldedSyncResult,
  performTransparentSync,
  createTransparentSyncObservable,
  createShieldedSyncObservable,
  buildSyncObservables,
} from "./synchronisation";
import { BtcOperation, BitcoinAccount, ZcashAccount } from "./types";
import BigNumber from "bignumber.js";
import type {
  ShieldedTransaction,
  ShieldedSyncResult,
  DecryptedTransaction,
} from "@ledgerhq/zcash-shielded/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { DerivationMode, SyncConfig } from "@ledgerhq/types-live";
import { SYNC_TYPE_TRANSPARENT, SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { firstValueFrom, from } from "rxjs";
import { setCoinConfig } from "./config";
import { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";

describe("removeReplaced", () => {
  const baseTx: Omit<BtcOperation, "hash" | "id" | "blockHeight" | "date" | "extra"> = {
    accountId: "test-account",
    type: "IN",
    fee: new BigNumber(1000),
    value: new BigNumber(50000),
    senders: ["sender1"],
    recipients: ["recipient1"],
    blockHash: null,
    hasFailed: false,
  };

  it("should keep confirmed transactions and remove unconfirmed replacements", () => {
    const confirmedTx: BtcOperation = {
      ...baseTx,
      id: "confirmed1",
      hash: "tx1",
      blockHeight: 100, // Confirmed transaction
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const unconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "unconfirmed1",
      hash: "tx2",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([confirmedTx, unconfirmedTx]);
    expect(result).toEqual([confirmedTx]); // Unconfirmed tx should be removed
  });

  it("should remove all unconfirmed conflicts once both are older than two hours", () => {
    const oldUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "oldUnconfirmed",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-02T00:00:00Z"),
      extra: { inputs: ["input1"] },
    };

    const newUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "newUnconfirmed",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02T01:00:00Z"), // Newer date
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced(
      [oldUnconfirmedTx, newUnconfirmedTx],
      Date.parse("2024-01-02T04:00:00Z"),
    );
    expect(result).toEqual([]); // Both are older than the 2h pending horizon
  });

  it("should replace old unconfirmed transaction after two hours", () => {
    const oldUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "oldUnconfirmed",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-02T00:00:00Z"),
      extra: { inputs: ["input1"] },
    };

    const newUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "newUnconfirmed",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02T01:00:00Z"), // Newer date
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced(
      [oldUnconfirmedTx, newUnconfirmedTx],
      Date.parse("2024-01-02T03:00:00Z"),
    );
    expect(result).toEqual([newUnconfirmedTx]);
  });

  it("should replace transactions based on block height", () => {
    const lowerHeightTx: BtcOperation = {
      ...baseTx,
      id: "lowHeight",
      hash: "tx1",
      blockHeight: 90, // Lower height
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const higherHeightTx: BtcOperation = {
      ...baseTx,
      id: "highHeight",
      hash: "tx2",
      blockHeight: 100, // Higher block height
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([lowerHeightTx, higherHeightTx]);
    expect(result).toEqual([higherHeightTx]); // Lower height tx should be removed
  });

  it("should keep transactions without inputs", () => {
    const txWithoutInputs: BtcOperation = {
      ...baseTx,
      type: "OUT", // NOTE: we don't set inputs in extra data for OUT transactions
      id: "tx1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: {}, // No inputs
    };

    const txWithInputs: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([txWithoutInputs, txWithInputs]);
    expect(result).toEqual([txWithoutInputs, txWithInputs]);
    // Both should remain, order should be preserved
  });

  it("should remove multiple-input unconfirmed conflicts once stale", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-02T00:00:00Z"),
      extra: { inputs: ["input1", "input2"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02T01:00:00Z"),
      extra: { inputs: ["input1", "input2"] },
    };

    const result = removeReplaced([tx1, tx2], Date.parse("2024-01-02T02:00:00Z"));
    expect(result).toEqual([tx1, tx2]);
  });

  it("should keep multiple unrelated transactions", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input2"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toEqual([tx1, tx2]);
    // Both should remain since they have different inputs
    // Order should be preserved
  });

  it("should always keep coinbase transactions", () => {
    const coinbaseTx: BtcOperation = {
      ...baseTx,
      id: "coinbaseTx",
      hash: "coinbaseTx",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["0000000000000000000000000000000000000000000000000000000000000000"] }, // Coinbase input
    };

    const normalTx: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: 101, // Newer block
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([coinbaseTx, normalTx]);

    expect(result).toContain(coinbaseTx); // Coinbase should always be kept
  });

  it("should correctly handle multiple transactions with different inputs", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1", "input2"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input3"] },
    };

    const tx3: BtcOperation = {
      ...baseTx,
      id: "tx3",
      hash: "tx3",
      blockHeight: 110,
      date: new Date("2024-01-03"),
      extra: { inputs: ["input4"] },
    };

    const result = removeReplaced([tx1, tx2, tx3]);
    expect(result).toEqual([tx1, tx2, tx3]);
    // All should remain since they have different inputs
    // Order should be preserved
  });

  // ✅ **New Edge Case: Unconfirmed Transaction References Inputs from Two Confirmed Transactions**
  it("should remove an unconfirmed transaction that references inputs from two confirmed transactions", () => {
    const confirmedTx1: BtcOperation = {
      ...baseTx,
      id: "confirmed1",
      hash: "tx1",
      blockHeight: 100, // Confirmed
      date: new Date("2024-01-01"),
      extra: { inputs: ["inputA"] },
    };

    const confirmedTx2: BtcOperation = {
      ...baseTx,
      id: "confirmed2",
      hash: "tx2",
      blockHeight: 101, // Confirmed
      date: new Date("2024-01-02"),
      extra: { inputs: ["inputB"] },
    };

    const unconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "unconfirmed",
      hash: "tx3",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-03"),
      extra: { inputs: ["inputA", "inputB"] }, // References inputs from two confirmed txs
    };

    const result = removeReplaced([confirmedTx1, confirmedTx2, unconfirmedTx]);
    expect(result).toContain(confirmedTx1);
    expect(result).toContain(confirmedTx2);
    expect(result).not.toContain(unconfirmedTx); // ✅ Unconfirmed transaction should be removed
  });

  it("should not replace a confirmed transaction if an unconfirmed transaction has more inputs", () => {
    const confirmedTx: BtcOperation = {
      ...baseTx,
      id: "confirmed",
      hash: "tx3",
      blockHeight: 100, // Confirmed
      date: new Date("2024-01-01"),
      extra: { inputs: ["inputX"] },
    };

    const unconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "unconfirmed",
      hash: "tx4",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-02"),
      extra: { inputs: ["inputX", "inputY", "inputZ"] },
    };

    const result = removeReplaced([confirmedTx, unconfirmedTx]);
    expect(result).toContain(confirmedTx); // ✅ Confirmed tx should not be replaced
    expect(result).not.toContain(unconfirmedTx); // Unconfirmed tx should be replaced
  });

  it("should keep both transactions if they have the same block height and date but different hashes", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "dup1",
      hash: "tx5",
      blockHeight: 100,
      date: new Date("2024-01-01T12:00:00Z"),
      extra: { inputs: ["inputA"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "dup2",
      hash: "tx6",
      blockHeight: 100, // Same height
      date: new Date("2024-01-01T12:00:00Z"), // Same timestamp
      extra: { inputs: ["inputA"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toContain(tx1);
    expect(result).toContain(tx2); // ✅ Both should be retained
  });

  it("should always keep transactions without inputs", () => {
    const noInputTx: BtcOperation = {
      ...baseTx,
      id: "noInputs",
      hash: "tx7",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: {}, // No inputs
    };

    const result = removeReplaced([noInputTx]);
    expect(result).toContain(noInputTx); // ✅ Should always be kept
  });

  it("should remove only necessary transactions while keeping order intact", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-01"),
      extra: { inputs: ["inputX"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 110, // Confirmed, should replace tx1
      date: new Date("2024-01-02"),
      extra: { inputs: ["inputX"] }, // Same input as tx1
    };

    const tx3: BtcOperation = {
      ...baseTx,
      id: "tx3",
      hash: "tx3",
      blockHeight: 105, // Confirmed, separate input
      date: new Date("2024-01-03"),
      extra: { inputs: ["inputY"] }, // Different input
    };

    const tx4: BtcOperation = {
      ...baseTx,
      id: "tx4",
      hash: "tx4",
      blockHeight: 120, // Confirmed, separate input
      date: new Date("2024-01-04"),
      extra: { inputs: ["inputZ"] }, // Different input
    };

    const result = removeReplaced([tx1, tx2, tx3, tx4]);
    expect(result).toEqual([tx2, tx3, tx4]); // ✅ tx1 is removed, but order remains
  });

  it("should keep all coinbase mining transactions with empty inputs (DigiByte mining scenario)", () => {
    const coinbaseTx1: BtcOperation = {
      ...baseTx,
      id: "cb1-IN",
      hash: "cb1",
      blockHeight: 23107323,
      date: new Date("2026-03-09T04:22:22Z"),
      extra: { inputs: [] },
    };

    const coinbaseTx2: BtcOperation = {
      ...baseTx,
      id: "cb2-IN",
      hash: "cb2",
      blockHeight: 23122260,
      date: new Date("2026-03-11T18:30:23Z"),
      extra: { inputs: [] },
    };

    const coinbaseTx3: BtcOperation = {
      ...baseTx,
      id: "cb3-IN",
      hash: "cb3",
      blockHeight: 23124700,
      date: new Date("2026-03-12T04:42:34Z"),
      extra: { inputs: [] },
    };

    const result = removeReplaced([coinbaseTx1, coinbaseTx2, coinbaseTx3]);
    expect(result).toEqual([coinbaseTx1, coinbaseTx2, coinbaseTx3]);
  });

  it("should retain only the most confirmed+recent tx among several using same input", () => {
    const tx1 = {
      ...baseTx,
      id: "tx1",
      hash: "h1",
      blockHeight: null,
      date: new Date("2024-01-01"),
      extra: { inputs: ["inp"] },
    };
    const tx2 = {
      ...baseTx,
      id: "tx2",
      hash: "h2",
      blockHeight: 100,
      date: new Date("2024-01-02"),
      extra: { inputs: ["inp"] },
    };
    const tx3 = {
      ...baseTx,
      id: "tx3",
      hash: "h3",
      blockHeight: 105,
      date: new Date("2024-01-03"),
      extra: { inputs: ["inp"] },
    };

    const result = removeReplaced([tx1, tx2, tx3]);
    expect(result).toEqual([tx3]); // Only latest confirmed remains
  });
});

describe("getTxType", () => {
  it("should return SHIELDED_TX_ORCHARD_IN when transfer_type is incoming", () => {
    const tx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(100), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_IN");
  });

  it("should return SHIELDED_TX_ORCHARD_OUT when transfer_type is outgoing", () => {
    const tx: ShieldedTransaction = {
      id: "tx2",
      hex: "00",
      blockHeight: 101,
      blockHash: "hash2",
      timestamp: 1700000001,
      fee: new BigNumber(200),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(200), memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });

  it("should return SHIELDED_TX_INTERNAL when transfer_type is internal", () => {
    const tx: ShieldedTransaction = {
      id: "tx3",
      hex: "00",
      blockHeight: 102,
      blockHash: "hash3",
      timestamp: 1700000002,
      fee: new BigNumber(50),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(50), memo: "", transfer_type: "internal" }],
        sapling_outputs: [],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
  });

  it("should return UNKNOWN when decryptedData is undefined", () => {
    const tx: ShieldedTransaction = {
      id: "tx4",
      hex: "00",
      blockHeight: 103,
      blockHash: "hash4",
      timestamp: 1700000003,
      fee: new BigNumber(300),
    };
    expect(getTxType(tx)).toBe("UNKNOWN");
  });

  it("should return SHIELDED_TX_SAPLING_IN for Sapling-only incoming tx", () => {
    const tx: ShieldedTransaction = {
      id: "tx5",
      hex: "00",
      blockHeight: 104,
      blockHash: "hash5",
      timestamp: 1700000004,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [{ amount: new BigNumber(500), memo: "", transfer_type: "incoming" }],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_SAPLING_IN");
  });

  it("should return SHIELDED_TX_SAPLING_OUT for Sapling-only outgoing tx", () => {
    const tx: ShieldedTransaction = {
      id: "tx6",
      hex: "00",
      blockHeight: 105,
      blockHash: "hash6",
      timestamp: 1700000005,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [{ amount: new BigNumber(500), memo: "", transfer_type: "outgoing" }],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_SAPLING_OUT");
  });

  it("should prefer Orchard over Sapling when both are present", () => {
    const tx: ShieldedTransaction = {
      id: "tx7",
      hex: "00",
      blockHeight: 106,
      blockHash: "hash7",
      timestamp: 1700000006,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(300), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [{ amount: new BigNumber(200), memo: "", transfer_type: "outgoing" }],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_IN");
  });

  // Helper: builds a minimal ShieldedTransaction with custom decryptedData
  const makeTx = (data: Partial<DecryptedTransaction>): ShieldedTransaction => ({
    id: "tx-test",
    hex: "00",
    blockHeight: 100,
    blockHash: "hash-test",
    timestamp: 1700000000,
    fee: new BigNumber(100),
    decryptedData: {
      orchard_outputs: data.orchard_outputs ?? [],
      sapling_outputs: data.sapling_outputs ?? [],
    },
  });

  // LIVE-27919: type must be derived from net balance, not first note
  it("should return SHIELDED_TX_ORCHARD_IN based on net balance, not first note", () => {
    // First note is outgoing (200), second is a larger incoming (1000) → net +800 → IN
    const tx = makeTx({
      orchard_outputs: [
        { amount: new BigNumber(200), memo: "", transfer_type: "outgoing" },
        { amount: new BigNumber(1000), memo: "", transfer_type: "incoming" },
      ],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_IN");
  });

  it("should return SHIELDED_TX_ORCHARD_OUT for outgoing tx with internal change", () => {
    const tx = makeTx({
      orchard_outputs: [
        { amount: new BigNumber(5000), memo: "", transfer_type: "outgoing" },
        { amount: new BigNumber(1000), memo: "", transfer_type: "internal" },
      ],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });

  it("should return SHIELDED_TX_INTERNAL when all notes are internal", () => {
    const tx = makeTx({
      orchard_outputs: [{ amount: new BigNumber(3000), memo: "", transfer_type: "internal" }],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
  });

  it("should return SHIELDED_TX_INTERNAL when incoming equals outgoing amounts", () => {
    const tx = makeTx({
      orchard_outputs: [
        { amount: new BigNumber(500), memo: "", transfer_type: "incoming" },
        { amount: new BigNumber(500), memo: "", transfer_type: "outgoing" },
      ],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
  });

  it("should return SHIELDED_TX_ORCHARD_OUT when orchard outgoing exceeds sapling incoming", () => {
    const tx = makeTx({
      orchard_outputs: [{ amount: new BigNumber(600), memo: "", transfer_type: "outgoing" }],
      sapling_outputs: [{ amount: new BigNumber(200), memo: "", transfer_type: "incoming" }],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });

  it("should return SHIELDED_TX_SAPLING_OUT for sapling-only outgoing tx with internal change", () => {
    const tx = makeTx({
      orchard_outputs: [],
      sapling_outputs: [
        { amount: new BigNumber(3000), memo: "", transfer_type: "outgoing" },
        { amount: new BigNumber(500), memo: "", transfer_type: "internal" },
      ],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_SAPLING_OUT");
  });

  // LIVE-27919: explicit coverage for each transfer direction
  it("should return SHIELDED_TX_ORCHARD_IN for a transparent→shielded (shielding) tx", () => {
    // ZEC moves from transparent into the Orchard pool: the shielded side only sees incoming notes
    const tx = makeTx({
      orchard_outputs: [{ amount: new BigNumber(10000), memo: "", transfer_type: "incoming" }],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_IN");
  });

  it("should return SHIELDED_TX_ORCHARD_OUT for a shielded→transparent (deshielding) tx", () => {
    // ZEC moves from Orchard pool to a transparent address: the shielded side only sees outgoing notes
    const tx = makeTx({
      orchard_outputs: [{ amount: new BigNumber(8000), memo: "", transfer_type: "outgoing" }],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });

  it("should return SHIELDED_TX_ORCHARD_IN for a shielded→shielded (Orchard→Orchard) incoming tx", () => {
    // Net positive: more received than sent within the shielded pool
    const tx = makeTx({
      orchard_outputs: [
        { amount: new BigNumber(5000), memo: "", transfer_type: "incoming" },
        { amount: new BigNumber(500), memo: "", transfer_type: "internal" }, // change
      ],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_IN");
  });

  it("should return SHIELDED_TX_ORCHARD_OUT for a shielded→shielded (Orchard→Orchard) outgoing tx", () => {
    // Net negative: more spent than received within the shielded pool
    const tx = makeTx({
      orchard_outputs: [
        { amount: new BigNumber(5000), memo: "", transfer_type: "outgoing" },
        { amount: new BigNumber(1000), memo: "", transfer_type: "internal" }, // change back
      ],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });
});

describe("convertShieldedTransactionsToOperations", () => {
  it("should convert shielded transactions to BtcOperation format", () => {
    const shieldedTxs: ShieldedTransaction[] = [
      {
        id: "tx1",
        hex: "00",
        blockHeight: 100,
        blockHash: "blockhash1",
        timestamp: 1700000000,
        fee: new BigNumber(500),
        decryptedData: {
          orchard_outputs: [{ amount: new BigNumber(1000), memo: "", transfer_type: "incoming" }],
          sapling_outputs: [],
        },
      },
    ];
    const accountId = "js:2:zcash:test-xpub:";
    const result = convertShieldedTransactionsToOperations(shieldedTxs, accountId);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      hash: "blockhash1",
      accountId,
      blockHash: "blockhash1",
      blockHeight: 100,
      type: "SHIELDED_TX_ORCHARD_IN",
      date: new Date(1700000000), // timestamp in seconds: code uses new Date(tx.timestamp)
      fee: new BigNumber(500),
      value: new BigNumber(1000),
    });
    expect(result[0].id).toContain(accountId);
    expect(result[0].id).toContain("blockhash1");
  });

  it("should handle multiple shielded transactions", () => {
    const shieldedTxs: ShieldedTransaction[] = [
      {
        id: "tx1",
        hex: "00",
        blockHeight: 100,
        blockHash: "hash1",
        timestamp: 1700000000,
        fee: new BigNumber(100),
        decryptedData: {
          orchard_outputs: [{ amount: new BigNumber(1000), memo: "", transfer_type: "outgoing" }],
          sapling_outputs: [],
        },
      },
      {
        id: "tx2",
        hex: "00",
        blockHeight: 101,
        blockHash: "hash2",
        timestamp: 1700000001,
        fee: new BigNumber(200),
        decryptedData: {
          orchard_outputs: [{ amount: new BigNumber(0), memo: "", transfer_type: "internal" }],
          sapling_outputs: [],
        },
      },
      {
        id: "tx3",
        hex: "00",
        blockHeight: 102,
        blockHash: "hash3",
        timestamp: 1700000001,
        fee: new BigNumber(200),
      },
    ];
    const result = convertShieldedTransactionsToOperations(shieldedTxs, "acc-1");

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("SHIELDED_TX_ORCHARD_OUT");
    expect(result[1].type).toBe("SHIELDED_TX_INTERNAL");
    expect(result[2].type).toBe("UNKNOWN");
  });

  it("should return empty array for empty input", () => {
    const result = convertShieldedTransactionsToOperations([], "acc-1");
    expect(result).toEqual([]);
  });

  it("op.value for incoming tx includes only incoming notes", () => {
    // tx has both incoming and outgoing notes — op.value must count only incoming
    const tx: ShieldedTransaction = {
      id: "tx-mixed",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-mixed",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(3000), memo: "", transfer_type: "incoming" },
          { amount: new BigNumber(1000), memo: "", transfer_type: "outgoing" },
          { amount: new BigNumber(500), memo: "", transfer_type: "internal" },
        ],
        sapling_outputs: [],
      },
    };
    const [op] = convertShieldedTransactionsToOperations([tx], "acc-1");
    expect(op.type).toBe("SHIELDED_TX_ORCHARD_IN");
    expect(op.value).toEqual(new BigNumber(3000)); // only incoming notes
  });

  it("op.value for outgoing tx includes only outgoing notes", () => {
    const tx: ShieldedTransaction = {
      id: "tx-out",
      hex: "00",
      blockHeight: 101,
      blockHash: "hash-out",
      timestamp: 1700000001,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(2000), memo: "", transfer_type: "outgoing" },
          { amount: new BigNumber(800), memo: "", transfer_type: "internal" },
        ],
        sapling_outputs: [],
      },
    };
    const [op] = convertShieldedTransactionsToOperations([tx], "acc-1");
    expect(op.type).toBe("SHIELDED_TX_ORCHARD_OUT");
    expect(op.value).toEqual(new BigNumber(2000)); // only outgoing notes
  });

  it("op.value for internal tx is 0", () => {
    const tx: ShieldedTransaction = {
      id: "tx-internal",
      hex: "00",
      blockHeight: 102,
      blockHash: "hash-internal",
      timestamp: 1700000002,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(5000), memo: "", transfer_type: "internal" }],
        sapling_outputs: [],
      },
    };
    const [op] = convertShieldedTransactionsToOperations([tx], "acc-1");
    expect(op.type).toBe("SHIELDED_TX_INTERNAL");
    expect(op.value).toEqual(new BigNumber(0));
  });
});

describe("reduceShieldedSyncResult", () => {
  const createMockInfo = (overrides?: Partial<ZcashAccount>): any => ({
    currency: getCryptoCurrencyById("zcash"),
    address: "zs1test",
    index: 0,
    derivationPath: "44'/133'/0'/0'",
    derivationMode: 0,
    initialAccount: overrides || undefined,
  });

  it("should return accumulated with blockHeight when no new transactions", () => {
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: { balance: new BigNumber(890) } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [],
      lastProcessedBlock: 5000,
      processedBlocks: 0,
      remainingBlocks: 0,
    };
    const info = createMockInfo();

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [],
      accountUpdate: {
        blockHeight: 5000,
        balance: new BigNumber(890),
      },
    });
  });

  it("should merge new shielded operations and update balance for incoming tx, using initialAccount as base balance", () => {
    const initialBalance = new BigNumber(100000);
    const txAmount = new BigNumber(50000);

    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100), // ignored for incoming tx
      decryptedData: {
        orchard_outputs: [{ amount: txAmount, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        blockHeight: 99,
      } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [incomingTx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({ balance: new BigNumber(initialBalance) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [incomingTx],
      accountUpdate: {
        // private orchard balance is accumulated from shielded operations.
        // top-level account balance is not recomputed in reduceShieldedSyncResult.
        blockHeight: 100,
        privateInfo: {
          orchardBalance: txAmount,
        },
      },
    });
    expect(output.accountUpdate.operations).toHaveLength(1);
  });

  it("should merge new shielded operations and update balance for incoming tx, using accumulated balance as base balance", () => {
    const accumulatedBalance = new BigNumber(1000);
    const txAmount = new BigNumber(50000);

    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100), // ignored for incoming tx
      decryptedData: {
        orchard_outputs: [{ amount: txAmount, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        balance: new BigNumber(accumulatedBalance),
        blockHeight: 99,
      } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [incomingTx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({
      privateInfo: { orchardBalance: new BigNumber(100000) },
    } as Partial<ZcashAccount>);

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [incomingTx],
      accountUpdate: {
        // accumulated.accountUpdate.balance and info.initialAccount.privateInfo.orchardBalance
        // are not used to initialize the running orchard balance.
        blockHeight: 100,
        privateInfo: {
          orchardBalance: txAmount,
        },
      },
    });
    expect(output.accountUpdate.operations).toHaveLength(1);
  });

  it("should deduct fee for outgoing tx but not for incoming tx", () => {
    const initialBalance = new BigNumber(100000);
    const outgoingAmount = new BigNumber(20000);
    const outgoingFee = new BigNumber(500);

    const outgoingTx: ShieldedTransaction = {
      id: "tx-out",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-out",
      timestamp: 1700000000,
      fee: outgoingFee,
      decryptedData: {
        orchard_outputs: [{ amount: outgoingAmount, memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };
    const incomingTx: ShieldedTransaction = {
      id: "tx-in",
      hex: "01",
      blockHeight: 100,
      blockHash: "hash-in",
      timestamp: 1700000001,
      fee: new BigNumber(300), // fee NOT deducted for incoming
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(5000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        blockHeight: 99,
      } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [outgoingTx, incomingTx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({ balance: initialBalance });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // balance = initialBalance - outgoing - outgoingFee + incoming
    expect(output.accountUpdate.balance).toEqual(
      initialBalance.minus(outgoingAmount).minus(outgoingFee).plus(5000),
    );
  });

  it("should not double-count fees across chunks", () => {
    // Chunk 1: outgoing 3000 with fee 100, incoming 4000
    // Chunk 2: incoming 500
    // Expected final balance = initial(10000) - 3000 - 100 + 4000 + 500 = 11400
    const initialBalance = new BigNumber(10000);

    const outgoingTx: ShieldedTransaction = {
      id: "tx-out",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-out",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(3000), memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };
    const incomingTx: ShieldedTransaction = {
      id: "tx-in",
      hex: "01",
      blockHeight: 100,
      blockHash: "hash-in",
      timestamp: 1700000001,
      fee: new BigNumber(50),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(4000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const incomingTx2: ShieldedTransaction = {
      id: "tx-in2",
      hex: "02",
      blockHeight: 101,
      blockHash: "hash-in2",
      timestamp: 1700000002,
      fee: new BigNumber(50),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(500), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const info = createMockInfo({ balance: initialBalance });

    // Chunk 1
    const chunk1 = reduceShieldedSyncResult(
      {
        processedOperations: [],
        accountUpdate: { operations: [] as BtcOperation[] } as Partial<BitcoinAccount>,
      },
      {
        transactions: [outgoingTx, incomingTx],
        lastProcessedBlock: 100,
        processedBlocks: 1,
        remainingBlocks: 1,
      },
      info,
      "acc-1",
    );
    // After chunk 1: 10000 - 3000 - 100 + 4000 = 10900
    expect(chunk1.accountUpdate.balance).toEqual(new BigNumber(10900));

    // Chunk 2
    const chunk2 = reduceShieldedSyncResult(
      chunk1,
      {
        transactions: [incomingTx2],
        lastProcessedBlock: 101,
        processedBlocks: 1,
        remainingBlocks: 0,
      },
      info,
      "acc-1",
    );
    // After chunk 2: 10900 + 500 = 11400 (fee from chunk 1 not deducted again)
    expect(chunk2.accountUpdate.balance).toEqual(new BigNumber(11400));
  });

  it("should populate privateInfo in accountUpdate", () => {
    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(5000), memo: "hello", transfer_type: "incoming" },
        ],
        sapling_outputs: [{ amount: new BigNumber(2000), memo: "", transfer_type: "incoming" }],
      },
    };

    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: { operations: [] as BtcOperation[] } as Partial<BitcoinAccount>,
    };
    const info = createMockInfo({ balance: new BigNumber(10000) });

    const output = reduceShieldedSyncResult(
      accumulated,
      {
        transactions: [incomingTx],
        lastProcessedBlock: 100,
        processedBlocks: 1,
        remainingBlocks: 0,
      },
      info,
      "acc-1",
    );

    expect(output.accountUpdate.privateInfo).toBeDefined();
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(5000));
    expect(output.accountUpdate.privateInfo?.saplingBalance).toEqual(new BigNumber(2000));
    expect(output.accountUpdate.privateInfo?.transactions).toHaveLength(1);
    expect(output.accountUpdate.privateInfo?.syncState).toBe("complete");
  });

  it("should preserve ufvk and birthday from accumulated privateInfo", () => {
    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(1000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        privateInfo: {
          ufvk: "uview1testkey",
          birthday: "2023-01-01",
          orchardBalance: new BigNumber(0),
          saplingBalance: new BigNumber(0),
          syncState: "running" as const,
          lastSyncTimestamp: null,
          lastProcessedBlock: null,
          transactions: [],
        },
      } as Partial<BitcoinAccount>,
    };
    const info = createMockInfo({ balance: new BigNumber(10000) });

    const output = reduceShieldedSyncResult(
      accumulated,
      {
        transactions: [incomingTx],
        lastProcessedBlock: 100,
        processedBlocks: 1,
        remainingBlocks: 0,
      },
      info,
      "acc-1",
    );

    expect(output.accountUpdate.privateInfo?.ufvk).toBe("uview1testkey");
    expect(output.accountUpdate.privateInfo?.birthday).toBe("2023-01-01");
    expect(output.accountUpdate.privateInfo?.lastProcessedBlock).toBe(100);
  });

  it("should NOT deduct fee when net balance is positive despite first note being outgoing (LIVE-27918)", () => {
    const initialBalance = new BigNumber(100000);
    const tx: ShieldedTransaction = {
      id: "tx-net-in",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-net-in",
      timestamp: 1700000000,
      fee: new BigNumber(500),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(200), memo: "", transfer_type: "outgoing" },
          { amount: new BigNumber(1000), memo: "", transfer_type: "incoming" },
        ],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: initialBalance }),
      "acc-1",
    );
    // net incoming = +800 (1000 - 200), fee NOT deducted (tx is IN)
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(800));
    expect(output.accountUpdate.balance).toEqual(initialBalance.plus(800));
  });

  it("should compute balance delta correctly for a tx with both orchard and sapling notes (LIVE-27917)", () => {
    const tx: ShieldedTransaction = {
      id: "tx-mixed",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-mixed",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(5000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [{ amount: new BigNumber(2000), memo: "", transfer_type: "incoming" }],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: new BigNumber(0) }),
      "acc-1",
    );
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(5000));
    expect(output.accountUpdate.privateInfo?.saplingBalance).toEqual(new BigNumber(2000));
    expect(output.accountUpdate.balance).toEqual(new BigNumber(7000));
  });

  // LIVE-27917 + LIVE-27918: explicit coverage for each transfer direction

  it("should correctly compute balance delta and NOT deduct fee for a transparent→shielded (shielding) tx", () => {
    // ZEC enters the Orchard pool from a transparent source: only incoming notes visible on shielded side.
    // Fee was paid in the transparent layer — our code must NOT deduct it again here.
    const initialBalance = new BigNumber(50000);
    const tx: ShieldedTransaction = {
      id: "tx-shielding",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-shielding",
      timestamp: 1700000000,
      fee: new BigNumber(1000),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(9000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: initialBalance }),
      "acc-1",
    );
    // SHIELDED_TX_ORCHARD_IN → fee NOT deducted; delta = +9000
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(9000));
    expect(output.accountUpdate.balance).toEqual(initialBalance.plus(9000));
  });

  it("should correctly compute balance delta and deduct fee for a shielded→transparent (deshielding) tx", () => {
    // ZEC leaves the Orchard pool to a transparent address: only outgoing notes visible on shielded side.
    const initialBalance = new BigNumber(50000);
    const tx: ShieldedTransaction = {
      id: "tx-deshielding",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-deshielding",
      timestamp: 1700000000,
      fee: new BigNumber(500),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(8000), memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: initialBalance }),
      "acc-1",
    );
    // SHIELDED_TX_ORCHARD_OUT → fee IS deducted; delta = -8000 - 500
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(-8000));
    expect(output.accountUpdate.balance).toEqual(initialBalance.minus(8000).minus(500));
  });

  it("should correctly compute balance delta and deduct fee for a shielded→shielded (Orchard→Orchard) outgoing tx", () => {
    // ZEC sent within Orchard pool: outgoing note + internal change note.
    const initialBalance = new BigNumber(100000);
    const tx: ShieldedTransaction = {
      id: "tx-shielded-out",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-shielded-out",
      timestamp: 1700000000,
      fee: new BigNumber(200),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(5000), memo: "", transfer_type: "outgoing" },
          { amount: new BigNumber(1000), memo: "", transfer_type: "internal" }, // change
        ],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: initialBalance }),
      "acc-1",
    );
    // SHIELDED_TX_ORCHARD_OUT (net = -5000); internal note excluded from delta; fee IS deducted
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(-5000));
    expect(output.accountUpdate.balance).toEqual(initialBalance.minus(5000).minus(200));
  });

  it("should filter out already processed operations by blockHash", () => {
    const tx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(800), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [tx],
      accountUpdate: {
        balance: new BigNumber(700),
        blockHeight: 100,
      } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [tx],
      lastProcessedBlock: 100,
      processedBlocks: 0,
      remainingBlocks: 0,
    };
    const info = createMockInfo();

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [tx],
      accountUpdate: {
        blockHeight: 100,
        balance: new BigNumber(700),
      },
    });
  });
});

describe("createTransparentSyncObservable and performTransparentSync", () => {
  const mockSignerContext = jest.fn();
  let wallet: ReturnType<typeof jest.fn> & {
    generateAccount: jest.Mock;
    syncAccount: jest.Mock;
    getAccountBalance: jest.Mock;
    getAccountTransactions: jest.Mock;
    getAccountUnspentUtxos: jest.Mock;
  };

  beforeAll(() => {
    wallet = require("./wallet-btc").default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    wallet.generateAccount.mockResolvedValue({
      xpub: {
        getXpubAddresses: jest.fn().mockResolvedValue([{ address: "bc1addr" }]),
        storage: {
          getUniquesAddresses: jest.fn().mockReturnValue([{ address: "bc1change" }]),
        },
        freshAddress: "bc1fresh",
        freshAddressIndex: 0,
        explorer: { getCurrentBlock: jest.fn().mockResolvedValue({ height: 100 }) },
      },
    });
    wallet.syncAccount.mockResolvedValue(undefined);
  });

  it("should emit account update and complete on successful sync", async () => {
    const info: any = {
      currency: getCryptoCurrencyById("bitcoin"),
      address: "bc1test",
      index: 0,
      derivationPath: "44'/0'/0'/0/0",
      derivationMode: "" as any, // default/legacy mode
      initialAccount: {
        id: "js:2:bitcoin:xpub-test:",
        xpub: "xpub-test",
        operations: [],
        bitcoinResources: { walletAccount: null },
      },
    };

    const observable = createTransparentSyncObservable(info, mockSignerContext);
    const result = await firstValueFrom(observable);

    expect(result).toMatchObject({
      operationsCount: expect.any(Number),
      blockHeight: 100,
    });
  });

  it("performTransparentSync should return account shape with operations and balance", async () => {
    const info: any = {
      currency: getCryptoCurrencyById("bitcoin"),
      address: "bc1test",
      index: 0,
      derivationPath: "44'/0'/0'/0/0",
      derivationMode: "" as any,
      deviceId: "device-1",
      initialAccount: {
        id: "js:2:bitcoin:xpub-test:",
        xpub: "xpub-test",
        operations: [],
        bitcoinResources: { walletAccount: null },
      },
    };

    const result = await performTransparentSync(info, mockSignerContext);

    expect(result).toMatchObject({
      operationsCount: expect.any(Number),
      blockHeight: 100,
      balance: expect.any(BigNumber),
    });
    expect(Array.isArray(result.operations)).toBe(true);
  });
});

describe("createShieldedSyncObservable", () => {
  it("should emit accumulated account updates from shielded sync results", async () => {
    const tx1: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(120),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(3710), memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };

    const tx2: ShieldedTransaction = {
      id: "tx2",
      hex: "01",
      blockHeight: 100,
      blockHash: "hash2",
      timestamp: 1700000000,
      fee: new BigNumber(70),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(4321), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const tx3: ShieldedTransaction = {
      id: "tx3",
      hex: "02",
      blockHeight: 101,
      blockHash: "hash3",
      timestamp: 1800000000,
      fee: new BigNumber(40),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(585), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const shieldedSyncRaw = from<ShieldedSyncResult[]>([
      {
        transactions: [tx1, tx2],
        lastProcessedBlock: 100,
        processedBlocks: 0,
        remainingBlocks: 0,
      },
      {
        transactions: [tx3],
        lastProcessedBlock: 101,
        processedBlocks: 0,
        remainingBlocks: 0,
      },
    ]);

    const info: any = {
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      index: 0,
      derivationPath: "44'/133'/0'/0'",
      derivationMode: "0" as any, // encodeAccountId expects string for derivationMode
      initialAccount: {
        id: "js:2:zcash:xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4:0",
        xpub: "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4",
        operations: [],
        balance: new BigNumber(33333),
      },
    };

    const observable = createShieldedSyncObservable(info, shieldedSyncRaw);
    const updates: Partial<BitcoinAccount>[] = [];

    await new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: v => updates.push(v),
        error: reject,
        complete: resolve,
      });
    });

    expect(updates).toHaveLength(2);

    // Check update #1
    expect(updates[0]).toMatchObject({
      // orchardBalance = net note delta (fees are deducted from balance separately, not orchardBalance)
      // net = incoming tx2 (4321) - outgoing tx1 (3710) = 611
      blockHeight: 100,
      privateInfo: {
        orchardBalance: new BigNumber(611),
      },
    });
    expect(updates[0]?.operations).toHaveLength(2);

    // Check update #2
    expect(updates[1]).toMatchObject({
      // orchardBalance = 611 + tx3 incoming (585) = 1196
      blockHeight: 101,
      privateInfo: {
        orchardBalance: new BigNumber(1196),
      },
    });
    expect(updates[1]?.operations).toHaveLength(3);
  });

  it("should populate privateInfo with shielded balances and transactions in each update", async () => {
    const saplingTx: ShieldedTransaction = {
      id: "tx-sapling",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-sapling",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [
          { amount: new BigNumber(3000), memo: "memo1", transfer_type: "incoming" },
        ],
      },
    };
    const orchardTx: ShieldedTransaction = {
      id: "tx-orchard",
      hex: "01",
      blockHeight: 101,
      blockHash: "hash-orchard",
      timestamp: 1700000001,
      fee: new BigNumber(50),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(2000), memo: "memo2", transfer_type: "incoming" },
        ],
        sapling_outputs: [],
      },
    };

    const shieldedSyncRaw = from<ShieldedSyncResult[]>([
      {
        transactions: [saplingTx],
        lastProcessedBlock: 100,
        processedBlocks: 1,
        remainingBlocks: 1,
      },
      {
        transactions: [orchardTx],
        lastProcessedBlock: 101,
        processedBlocks: 1,
        remainingBlocks: 0,
      },
    ]);

    const info: AccountShapeInfo<ZcashAccount> = {
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      index: 0,
      derivationPath: "44'/133'/0'/0'",
      derivationMode: "0" as DerivationMode,
      initialAccount: {
        id: "js:2:zcash:xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4:0",
        xpub: "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4",
        operations: [],
        balance: new BigNumber(10000),
        privateInfo: {
          ufvk: "uview1testkey",
          birthday: "2023-01-01",
          orchardBalance: new BigNumber(0),
          saplingBalance: new BigNumber(0),
          syncState: "ready" as const,
          lastSyncTimestamp: null,
          lastProcessedBlock: null,
          transactions: [],
        },
      } as unknown as ZcashAccount,
    };

    const observable = createShieldedSyncObservable(info, shieldedSyncRaw);
    const updates: Partial<ZcashAccount>[] = [];
    await new Promise<void>((resolve, reject) => {
      observable.subscribe({ next: v => updates.push(v), error: reject, complete: resolve });
    });

    expect(updates).toHaveLength(2);

    // After chunk 1: Sapling 3000
    const pi1 = (updates[0] as Partial<ZcashAccount>).privateInfo;
    expect(pi1).toBeDefined();
    expect(pi1?.saplingBalance).toEqual(new BigNumber(3000));
    expect(pi1?.orchardBalance).toEqual(new BigNumber(0));
    expect(pi1?.transactions).toHaveLength(1);
    expect(pi1?.ufvk).toBe("uview1testkey");
    expect(pi1?.birthday).toBe("2023-01-01");

    // After chunk 2: Sapling 3000 + Orchard 2000
    const pi2 = (updates[1] as Partial<ZcashAccount>).privateInfo;
    expect(pi2?.saplingBalance).toEqual(new BigNumber(3000));
    expect(pi2?.orchardBalance).toEqual(new BigNumber(2000));
    expect(pi2?.transactions).toHaveLength(2);
    expect(pi2?.lastProcessedBlock).toBe(101);
  });
});

describe("buildSyncObservables", () => {
  const baseInfo: any = {
    currency: getCryptoCurrencyById("bitcoin"),
    address: "bc1test",
    index: 0,
    derivationPath: "44'/0'/0'/0/0",
    derivationMode: 0,
  };

  const defaultSyncConfig: SyncConfig = {
    paginationConfig: {},
  };

  it("should return only transparent sync for non-Zcash currency", () => {
    const signerContext = jest.fn();
    const { syncs, syncType } = buildSyncObservables(baseInfo, defaultSyncConfig, signerContext);

    expect(syncType).toBe(SYNC_TYPE_TRANSPARENT);
    expect(syncs).toHaveLength(1);
  });

  it("should return transparent and shielded sync for Zcash with ufvk", () => {
    setCoinConfig(() => ({
      info: {
        status: {
          type: "active",
        },
      },
    }));
    const zcashInfo: any = {
      ...baseInfo,
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      derivationPath: "44'/133'/0'/0'",
      derivationMode: "0" as any,
      initialAccount: {
        id: "js:2:zcash:xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4:0",
        xpub: "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4",
        operations: [],
        privateInfo: {
          ufvk: "uview123...",
          saplingBalance: new BigNumber(0),
          orchardBalance: new BigNumber(0),
          syncState: "ready",
          lastSyncTimestamp: null,
          lastProcessedBlock: null,
          transactions: [],
        },
      },
    };
    const signerContext = jest.fn();
    const transparentAndShieldedSyncConfig: SyncConfig = {
      paginationConfig: {},
      syncType: SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED,
    };
    const { syncs, syncType } = buildSyncObservables(
      zcashInfo,
      transparentAndShieldedSyncConfig,
      signerContext,
    );

    expect(syncType).toBe(SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED);
    expect(syncs).toHaveLength(2);
  });

  it("should return only transparent sync for Zcash without initialAccount", () => {
    const zcashInfoNoAccount: any = {
      ...baseInfo,
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      derivationPath: "44'/133'/0'/0'",
      initialAccount: undefined,
    };
    const signerContext = jest.fn();
    const { syncs } = buildSyncObservables(zcashInfoNoAccount, defaultSyncConfig, signerContext);

    expect(syncs).toHaveLength(1);
  });

  it("should respect syncType override in syncConfig", () => {
    const zcashInfo: any = {
      ...baseInfo,
      currency: getCryptoCurrencyById("zcash"),
      initialAccount: {
        id: "acc-1",
        xpub: "xpub",
        privateInfo: {
          ufvk: "uview",
          saplingBalance: new BigNumber(0),
          orchardBalance: new BigNumber(0),
          syncState: "ready",
          lastSyncTimestamp: null,
          lastProcessedBlock: null,
          transactions: [],
        },
      },
    };
    const transparentOnlyConfig: SyncConfig = {
      paginationConfig: {},
      syncType: SYNC_TYPE_TRANSPARENT,
    };
    const signerContext = jest.fn();
    const { syncs } = buildSyncObservables(zcashInfo, transparentOnlyConfig, signerContext);

    expect(syncs).toHaveLength(1);
  });
});
