import { getTxType, convertShieldedTransactionsToOperations } from "../operations";
import BigNumber from "bignumber.js";
import type { ShieldedTransaction, DecryptedTransaction } from "../types";

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
    const tx = makeTx({
      orchard_outputs: [{ amount: new BigNumber(10000), memo: "", transfer_type: "incoming" }],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_IN");
  });

  it("should return SHIELDED_TX_ORCHARD_OUT for a shielded→transparent (deshielding) tx", () => {
    const tx = makeTx({
      orchard_outputs: [{ amount: new BigNumber(8000), memo: "", transfer_type: "outgoing" }],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });

  it("should return SHIELDED_TX_ORCHARD_IN for a shielded→shielded (Orchard→Orchard) incoming tx", () => {
    const tx = makeTx({
      orchard_outputs: [
        { amount: new BigNumber(5000), memo: "", transfer_type: "incoming" },
        { amount: new BigNumber(500), memo: "", transfer_type: "internal" }, // change
      ],
    });
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_IN");
  });

  it("should return SHIELDED_TX_ORCHARD_OUT for a shielded→shielded (Orchard→Orchard) outgoing tx", () => {
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
      hash: "tx1",
      accountId,
      blockHash: "blockhash1",
      blockHeight: 100,
      type: "SHIELDED_TX_ORCHARD_IN",
      date: new Date(1700000000 * 1000), // timestamp is in Unix seconds
      fee: new BigNumber(500),
      value: new BigNumber(1000),
    });
    expect(result[0].id).toContain(accountId);
    expect(result[0].id).toContain("tx1");
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
    expect(op.value).toEqual(new BigNumber(3000));
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
    expect(op.value).toEqual(new BigNumber(2000));
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
