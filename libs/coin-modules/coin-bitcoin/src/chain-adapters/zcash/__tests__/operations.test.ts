import {
  getTxType,
  convertShieldedTransactionsToOperations,
  computeBalanceFromNotes,
  collectSpendableNotes,
  computeIronwoodBalanceFromNotes,
  collectIronwoodSpendableNotes,
  computeProtocolDeltas,
} from "../operations";
import BigNumber from "bignumber.js";
import type { ShieldedTransaction, DecryptedTransaction, DecryptedOutput } from "../types";

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

// A shielded→transparent send leaves no `incoming` or `outgoing` note behind: the
// value goes to a transparent output and only the change note comes back, marked
// `internal`. Deriving the type from the notes alone therefore reads it as a
// self-transfer. These cases mirror transactions observed on mainnet accounts.
describe("getTxType for shielded→transparent sends", () => {
  const deshieldingTx = (
    notes: DecryptedOutput[],
    transparentOut: number,
    fee = 15_000,
  ): ShieldedTransaction => ({
    id: "932c99c7837d7be18ed347213ae9a89a848ea9303f55e07ae5392f858f9258fc",
    hex: "00",
    blockHeight: 3_425_862,
    blockHash: "hash",
    timestamp: 1_700_000_000,
    fee: new BigNumber(fee),
    transparentOut: new BigNumber(transparentOut),
    hasTransparentInputs: false,
    decryptedData: { orchard_outputs: notes, sapling_outputs: [] },
  });

  it("classifies a z→t send with an internal change note as outgoing, not internal", () => {
    const tx = deshieldingTx(
      [{ amount: new BigNumber(943_170), memo: "", transfer_type: "internal" }],
      500_000,
    );
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });

  it("classifies a z→t send that consumed the whole note, leaving no change", () => {
    const tx = deshieldingTx([], 500_000, 45_000);
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });

  it("still reports a genuine self-transfer as internal when nothing left the pool", () => {
    const tx = deshieldingTx(
      [{ amount: new BigNumber(3000), memo: "", transfer_type: "internal" }],
      0,
    );
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
  });

  // A t→z shielding sends its transparent change back to a transparent address,
  // so it too has a transparent output — but that value comes from the
  // transparent inputs, not from the shielded pool.
  it("does not treat the transparent change of a t→z shielding tx as an outgoing send", () => {
    const tx: ShieldedTransaction = {
      ...deshieldingTx(
        [{ amount: new BigNumber(1000), memo: "", transfer_type: "internal" }],
        250_000,
        10_000,
      ),
      hasTransparentInputs: true,
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
  });

  // Accounts synced before the scanner reported the transparent bundle keep the
  // pre-existing classification until they are re-synced.
  it("falls back to internal when the transparent bundle was not reported", () => {
    const tx: ShieldedTransaction = {
      id: "scanned-before-the-field-existed",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash",
      timestamp: 1_700_000_000,
      fee: new BigNumber(15_000),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(3000), memo: "", transfer_type: "internal" }],
        sapling_outputs: [],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
  });
});

// ── getTxType — Ironwood pool ─────────────────────────────────────────

describe("getTxType for Ironwood outputs", () => {
  const makeIronwoodTx = (
    ironwoodNotes: DecryptedOutput[],
    orchardNotes: DecryptedOutput[] = [],
  ): ShieldedTransaction => ({
    id: "iw-tx",
    hex: "00",
    blockHeight: 100,
    blockHash: "iw-hash",
    timestamp: 1_700_000_000,
    fee: new BigNumber(100),
    decryptedData: {
      orchard_outputs: orchardNotes,
      sapling_outputs: [],
      ironwood_outputs: ironwoodNotes,
    },
  });

  it("returns SHIELDED_TX_IRONWOOD_IN for Ironwood-only incoming tx", () => {
    const tx = makeIronwoodTx([
      { amount: new BigNumber(5_000), memo: "", transfer_type: "incoming" },
    ]);
    expect(getTxType(tx)).toBe("SHIELDED_TX_IRONWOOD_IN");
  });

  it("returns SHIELDED_TX_IRONWOOD_OUT for Ironwood-only outgoing tx", () => {
    const tx = makeIronwoodTx([
      { amount: new BigNumber(5_000), memo: "", transfer_type: "outgoing" },
    ]);
    expect(getTxType(tx)).toBe("SHIELDED_TX_IRONWOOD_OUT");
  });

  it("prefers Ironwood over Orchard when both have incoming notes", () => {
    const tx = makeIronwoodTx(
      [{ amount: new BigNumber(3_000), memo: "", transfer_type: "incoming" }],
      [{ amount: new BigNumber(2_000), memo: "", transfer_type: "incoming" }],
    );
    expect(getTxType(tx)).toBe("SHIELDED_TX_IRONWOOD_IN");
  });

  it("prefers Ironwood over Orchard when both have outgoing notes", () => {
    const tx = makeIronwoodTx(
      [{ amount: new BigNumber(4_000), memo: "", transfer_type: "outgoing" }],
      [{ amount: new BigNumber(2_000), memo: "", transfer_type: "outgoing" }],
    );
    expect(getTxType(tx)).toBe("SHIELDED_TX_IRONWOOD_OUT");
  });

  it("returns SHIELDED_TX_IRONWOOD_OUT for Ironwood z→t send with internal change", () => {
    const tx: ShieldedTransaction = {
      id: "iw-deshield",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash",
      timestamp: 1_700_000_000,
      fee: new BigNumber(15_000),
      transparentOut: new BigNumber(500_000),
      hasTransparentInputs: false,
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [],
        ironwood_outputs: [{ amount: new BigNumber(943_170), memo: "", transfer_type: "internal" }],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_IRONWOOD_OUT");
  });

  it("returns SHIELDED_TX_INTERNAL when Ironwood notes are all internal", () => {
    const tx = makeIronwoodTx([
      { amount: new BigNumber(2_000), memo: "", transfer_type: "internal" },
    ]);
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
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

  // Outgoing `value` carries amount + fee, matching both the transparent operations
  // built in logic.ts and the optimistic operation emitted at signing time. A
  // confirmed operation valued without the fee makes the amount shown in history
  // change the moment the pending operation is replaced.
  it("op.value for outgoing tx covers the outgoing notes plus the fee", () => {
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
    expect(op.value).toEqual(new BigNumber(2100));
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

  // Mainnet transaction 932c99c7…: 1458170 zat spent, 500000 sent to a transparent
  // address, 15000 fee, 943170 zat returned as an internal change note. The history
  // used to show it as an internal transfer worth 0.
  it("op.value for a z→t send is the transparent amount plus the fee", () => {
    const tx: ShieldedTransaction = {
      id: "932c99c7837d7be18ed347213ae9a89a848ea9303f55e07ae5392f858f9258fc",
      hex: "00",
      transparentOut: new BigNumber(500_000),
      blockHeight: 3_425_862,
      blockHash: "hash",
      timestamp: 1_700_000_000,
      fee: new BigNumber(15_000),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(943_170), memo: "", transfer_type: "internal" }],
        sapling_outputs: [],
      },
    };
    const [op] = convertShieldedTransactionsToOperations([tx], "acc-1");
    expect(op.type).toBe("SHIELDED_TX_ORCHARD_OUT");
    expect(op.value).toEqual(new BigNumber(515_000));
    expect(op.fee).toEqual(new BigNumber(15_000));
  });

  it("op.value for a z→t send that left no change is still the transparent amount plus the fee", () => {
    const tx: ShieldedTransaction = {
      id: "d452101fabff",
      hex: "00",
      transparentOut: new BigNumber(955_000),
      blockHeight: 3_425_863,
      blockHash: "hash",
      timestamp: 1_700_000_000,
      fee: new BigNumber(45_000),
      decryptedData: { orchard_outputs: [], sapling_outputs: [] },
    };
    const [op] = convertShieldedTransactionsToOperations([tx], "acc-1");
    expect(op.type).toBe("SHIELDED_TX_ORCHARD_OUT");
    expect(op.value).toEqual(new BigNumber(1_000_000));
  });

  it("op.value for an incoming tx stays exclusive of the fee", () => {
    const tx: ShieldedTransaction = {
      id: "tx-in-fee",
      hex: "00",
      blockHeight: 103,
      blockHash: "hash",
      timestamp: 1_700_000_003,
      fee: new BigNumber(10_000),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(1_000_000), memo: "", transfer_type: "incoming" },
        ],
        sapling_outputs: [],
      },
    };
    const [op] = convertShieldedTransactionsToOperations([tx], "acc-1");
    expect(op.type).toBe("SHIELDED_TX_ORCHARD_IN");
    expect(op.value).toEqual(new BigNumber(1_000_000));
  });
});

// ── computeBalanceFromNotes ────────────────────────────────────────────

describe("computeBalanceFromNotes", () => {
  const makeTxWithNotes = (
    orchardNotes: DecryptedOutput[],
    saplingNotes: DecryptedOutput[] = [],
    id = "tx1",
  ): ShieldedTransaction => ({
    id,
    hex: "00",
    blockHeight: 100,
    blockHash: "hash",
    timestamp: 1700000000,
    fee: new BigNumber(100),
    decryptedData: { orchard_outputs: orchardNotes, sapling_outputs: saplingNotes },
  });

  it("treats notes without isSpent as unspent (conservative)", () => {
    const txs = [
      makeTxWithNotes([
        { amount: new BigNumber(1000), memo: "", transfer_type: "incoming" },
        { amount: new BigNumber(500), memo: "", transfer_type: "outgoing" },
      ]),
    ];
    expect(computeBalanceFromNotes(txs)).toEqual(new BigNumber(1000));
  });

  it("sums only unspent incoming and internal orchard notes", () => {
    const txs = [
      makeTxWithNotes([
        { amount: new BigNumber(5000), memo: "", transfer_type: "incoming", isSpent: false },
        { amount: new BigNumber(2000), memo: "", transfer_type: "internal", isSpent: false },
        { amount: new BigNumber(3000), memo: "", transfer_type: "outgoing", isSpent: false }, // excluded (outgoing)
        { amount: new BigNumber(1000), memo: "", transfer_type: "incoming", isSpent: true }, // excluded (spent)
      ]),
    ];
    expect(computeBalanceFromNotes(txs)).toEqual(new BigNumber(7000)); // 5000 + 2000
  });

  it("excludes notes where isSpent === true", () => {
    const txs = [
      makeTxWithNotes([
        { amount: new BigNumber(10000), memo: "", transfer_type: "incoming", isSpent: true },
        { amount: new BigNumber(3000), memo: "", transfer_type: "incoming", isSpent: false },
      ]),
    ];
    expect(computeBalanceFromNotes(txs)).toEqual(new BigNumber(3000));
  });

  it("returns zero for empty transaction list", () => {
    expect(computeBalanceFromNotes([])).toEqual(new BigNumber(0));
  });

  it("aggregates notes across multiple transactions", () => {
    const txs = [
      makeTxWithNotes(
        [{ amount: new BigNumber(5000), memo: "", transfer_type: "incoming", isSpent: false }],
        [],
        "tx1",
      ),
      makeTxWithNotes(
        [{ amount: new BigNumber(3000), memo: "", transfer_type: "internal", isSpent: false }],
        [],
        "tx2",
      ),
    ];
    expect(computeBalanceFromNotes(txs)).toEqual(new BigNumber(8000));
  });
});

// ── collectSpendableNotes ──────────────────────────────────────────────

describe("collectSpendableNotes", () => {
  const makeFullNote = (overrides: Partial<DecryptedOutput> = {}): DecryptedOutput => ({
    amount: new BigNumber(10000),
    memo: "",
    transfer_type: "incoming",
    isSpent: false,
    nullifier: "aa".repeat(32),
    rho: "ee".repeat(32),
    rseed: "bb".repeat(32),
    cmx: "cc".repeat(32),
    position: "42",
    recipient: "dd".repeat(43),
    ...overrides,
  });

  const makeTx = (notes: DecryptedOutput[], id = "tx1"): ShieldedTransaction => ({
    id,
    hex: "00",
    blockHeight: 100,
    blockHash: "hash",
    timestamp: 1700000000,
    fee: new BigNumber(100),
    decryptedData: { orchard_outputs: notes, sapling_outputs: [] },
  });

  it("returns only notes with all spending fields present and isSpent !== true", () => {
    const txs = [
      makeTx([
        makeFullNote({ amount: new BigNumber(5000) }),
        makeFullNote({ amount: new BigNumber(3000), transfer_type: "internal" }),
      ]),
    ];
    const result = collectSpendableNotes(txs);
    expect(result).toHaveLength(2);
    expect(result[0].amount).toEqual(new BigNumber(5000));
    expect(result[1].amount).toEqual(new BigNumber(3000));
  });

  it("excludes spent notes", () => {
    const txs = [
      makeTx([
        makeFullNote({ isSpent: true, nullifier: "aa".repeat(32) }),
        makeFullNote({ isSpent: false, nullifier: "bb".repeat(32), amount: new BigNumber(8000) }),
      ]),
    ];
    const result = collectSpendableNotes(txs);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(new BigNumber(8000));
  });

  it("excludes outgoing notes", () => {
    const txs = [
      makeTx([
        makeFullNote({ transfer_type: "outgoing", nullifier: "aa".repeat(32) }),
        makeFullNote({ transfer_type: "incoming", nullifier: "bb".repeat(32) }),
      ]),
    ];
    const result = collectSpendableNotes(txs);
    expect(result).toHaveLength(1);
  });

  it("excludes notes missing any spending field", () => {
    const txs = [
      makeTx([
        // Missing nullifier
        {
          amount: new BigNumber(5000),
          memo: "",
          transfer_type: "incoming" as const,
          isSpent: false,
          rseed: "bb".repeat(32),
          cmx: "cc".repeat(32),
          position: "0",
          recipient: "dd".repeat(43),
        },
        // Complete note
        makeFullNote({ nullifier: "ee".repeat(32), amount: new BigNumber(3000) }),
      ]),
    ];
    const result = collectSpendableNotes(txs);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(new BigNumber(3000));
  });

  it("returns correct txid and outputIndex for each note", () => {
    const txs = [
      makeTx(
        [
          makeFullNote({ nullifier: "aa".repeat(32), amount: new BigNumber(1000) }),
          makeFullNote({ nullifier: "bb".repeat(32), amount: new BigNumber(2000) }),
        ],
        "tx-abc",
      ),
    ];
    const result = collectSpendableNotes(txs);
    expect(result).toHaveLength(2);
    expect(result[0].txid).toBe("tx-abc");
    expect(result[0].outputIndex).toBe(0);
    expect(result[1].txid).toBe("tx-abc");
    expect(result[1].outputIndex).toBe(1);
  });

  it("returns empty array when there are no transactions", () => {
    expect(collectSpendableNotes([])).toEqual([]);
  });
});

// ── computeIronwoodBalanceFromNotes ────────────────────────────────────

describe("computeIronwoodBalanceFromNotes", () => {
  const makeIwTx = (notes: DecryptedOutput[], id = "iw-tx"): ShieldedTransaction => ({
    id,
    hex: "00",
    blockHeight: 100,
    blockHash: "hash",
    timestamp: 1_700_000_000,
    fee: new BigNumber(100),
    decryptedData: {
      orchard_outputs: [],
      sapling_outputs: [],
      ironwood_outputs: notes,
    },
  });

  it("sums unspent incoming and internal ironwood notes", () => {
    const txs = [
      makeIwTx([
        { amount: new BigNumber(5_000), memo: "", transfer_type: "incoming", isSpent: false },
        { amount: new BigNumber(2_000), memo: "", transfer_type: "internal", isSpent: false },
        { amount: new BigNumber(3_000), memo: "", transfer_type: "outgoing", isSpent: false },
        { amount: new BigNumber(1_000), memo: "", transfer_type: "incoming", isSpent: true },
      ]),
    ];
    expect(computeIronwoodBalanceFromNotes(txs)).toEqual(new BigNumber(7_000));
  });

  it("excludes outgoing ironwood notes", () => {
    const txs = [makeIwTx([{ amount: new BigNumber(8_000), memo: "", transfer_type: "outgoing" }])];
    expect(computeIronwoodBalanceFromNotes(txs)).toEqual(new BigNumber(0));
  });

  it("returns zero for empty transaction list", () => {
    expect(computeIronwoodBalanceFromNotes([])).toEqual(new BigNumber(0));
  });

  it("returns zero when transactions have no ironwood_outputs", () => {
    const txsWithoutIronwood: ShieldedTransaction[] = [
      {
        id: "no-iw",
        hex: "00",
        blockHeight: 100,
        blockHash: "hash",
        timestamp: 1_700_000_000,
        fee: new BigNumber(100),
        decryptedData: {
          orchard_outputs: [{ amount: new BigNumber(9_000), memo: "", transfer_type: "incoming" }],
          sapling_outputs: [],
        },
      },
    ];
    expect(computeIronwoodBalanceFromNotes(txsWithoutIronwood)).toEqual(new BigNumber(0));
  });

  it("does not count orchard notes — pools are independent", () => {
    const tx: ShieldedTransaction = {
      id: "mixed-pool",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash",
      timestamp: 1_700_000_000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(9_000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
        ironwood_outputs: [{ amount: new BigNumber(4_000), memo: "", transfer_type: "incoming" }],
      },
    };
    expect(computeIronwoodBalanceFromNotes([tx])).toEqual(new BigNumber(4_000));
  });
});

// ── collectIronwoodSpendableNotes ──────────────────────────────────────

describe("collectIronwoodSpendableNotes", () => {
  const makeFullIwNote = (overrides: Partial<DecryptedOutput> = {}): DecryptedOutput => ({
    amount: new BigNumber(10_000),
    memo: "",
    transfer_type: "incoming",
    isSpent: false,
    nullifier: "aa".repeat(32),
    rho: "ee".repeat(32),
    rseed: "bb".repeat(32),
    cmx: "cc".repeat(32),
    position: "42",
    recipient: "dd".repeat(43),
    ...overrides,
  });

  const makeIwTx = (notes: DecryptedOutput[], id = "iw-tx"): ShieldedTransaction => ({
    id,
    hex: "00",
    blockHeight: 100,
    blockHash: "hash",
    timestamp: 1_700_000_000,
    fee: new BigNumber(100),
    decryptedData: {
      orchard_outputs: [],
      sapling_outputs: [],
      ironwood_outputs: notes,
    },
  });

  it("returns spendable notes with all required fields", () => {
    const txs = [
      makeIwTx([
        makeFullIwNote({ amount: new BigNumber(5_000), nullifier: "aa".repeat(32) }),
        makeFullIwNote({
          amount: new BigNumber(3_000),
          transfer_type: "internal",
          nullifier: "ff".repeat(32),
        }),
      ]),
    ];
    const result = collectIronwoodSpendableNotes(txs);
    expect(result).toHaveLength(2);
    expect(result[0].amount).toEqual(new BigNumber(5_000));
    expect(result[1].amount).toEqual(new BigNumber(3_000));
  });

  it("excludes spent ironwood notes", () => {
    const txs = [
      makeIwTx([
        makeFullIwNote({ isSpent: true, nullifier: "aa".repeat(32) }),
        makeFullIwNote({
          isSpent: false,
          nullifier: "bb".repeat(32),
          amount: new BigNumber(8_000),
        }),
      ]),
    ];
    const result = collectIronwoodSpendableNotes(txs);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(new BigNumber(8_000));
  });

  it("excludes outgoing ironwood notes", () => {
    const txs = [
      makeIwTx([
        makeFullIwNote({ transfer_type: "outgoing" }),
        makeFullIwNote({ transfer_type: "incoming", nullifier: "cc".repeat(32) }),
      ]),
    ];
    expect(collectIronwoodSpendableNotes(txs)).toHaveLength(1);
  });

  it("excludes notes missing any spending field", () => {
    const txs = [
      makeIwTx([
        // missing nullifier
        {
          amount: new BigNumber(5_000),
          memo: "",
          transfer_type: "incoming" as const,
          isSpent: false,
          rseed: "bb".repeat(32),
          cmx: "cc".repeat(32),
          position: "0",
          recipient: "dd".repeat(43),
        },
        makeFullIwNote({ nullifier: "ee".repeat(32), amount: new BigNumber(3_000) }),
      ]),
    ];
    const result = collectIronwoodSpendableNotes(txs);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(new BigNumber(3_000));
  });

  it("populates txid and outputIndex correctly", () => {
    const txs = [
      makeIwTx(
        [
          makeFullIwNote({ nullifier: "aa".repeat(32), amount: new BigNumber(1_000) }),
          makeFullIwNote({ nullifier: "bb".repeat(32), amount: new BigNumber(2_000) }),
        ],
        "iw-abc",
      ),
    ];
    const result = collectIronwoodSpendableNotes(txs);
    expect(result).toHaveLength(2);
    expect(result[0].txid).toBe("iw-abc");
    expect(result[0].outputIndex).toBe(0);
    expect(result[1].outputIndex).toBe(1);
  });

  it("returns empty array when no transactions", () => {
    expect(collectIronwoodSpendableNotes([])).toEqual([]);
  });

  it("does not pick up orchard notes — pools are independent", () => {
    const tx: ShieldedTransaction = {
      id: "mixed",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash",
      timestamp: 1_700_000_000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [makeFullIwNote({ nullifier: "or".repeat(32) })],
        sapling_outputs: [],
        ironwood_outputs: [],
      },
    };
    expect(collectIronwoodSpendableNotes([tx])).toEqual([]);
  });
});

// ── computeProtocolDeltas ──────────────────────────────────────────────

describe("computeProtocolDeltas", () => {
  const makeTxWithAllPools = (
    orchardNotes: DecryptedOutput[],
    saplingNotes: DecryptedOutput[],
    ironwoodNotes: DecryptedOutput[],
    id = "tx-deltas",
  ): ShieldedTransaction => ({
    id,
    hex: "00",
    blockHeight: 100,
    blockHash: "hash",
    timestamp: 1_700_000_000,
    fee: new BigNumber(100),
    decryptedData: {
      orchard_outputs: orchardNotes,
      sapling_outputs: saplingNotes,
      ironwood_outputs: ironwoodNotes,
    },
  });

  it("returns zero deltas for empty transaction list", () => {
    const result = computeProtocolDeltas([]);
    expect(result.deltaSapling).toEqual(new BigNumber(0));
    expect(result.deltaOrchard).toEqual(new BigNumber(0));
    expect(result.deltaIronwood).toEqual(new BigNumber(0));
  });

  it("computes positive deltaIronwood for incoming ironwood notes", () => {
    const txs = [
      makeTxWithAllPools(
        [],
        [],
        [{ amount: new BigNumber(5_000), memo: "", transfer_type: "incoming" }],
      ),
    ];
    const result = computeProtocolDeltas(txs);
    expect(result.deltaIronwood).toEqual(new BigNumber(5_000));
    expect(result.deltaOrchard).toEqual(new BigNumber(0));
  });

  it("computes negative deltaIronwood for outgoing ironwood notes", () => {
    const txs = [
      makeTxWithAllPools(
        [],
        [],
        [{ amount: new BigNumber(3_000), memo: "", transfer_type: "outgoing" }],
      ),
    ];
    const result = computeProtocolDeltas(txs);
    expect(result.deltaIronwood).toEqual(new BigNumber(-3_000));
  });

  it("computes independent deltas for each pool", () => {
    const txs = [
      makeTxWithAllPools(
        [{ amount: new BigNumber(1_000), memo: "", transfer_type: "incoming" }],
        [{ amount: new BigNumber(2_000), memo: "", transfer_type: "outgoing" }],
        [{ amount: new BigNumber(4_000), memo: "", transfer_type: "incoming" }],
      ),
    ];
    const result = computeProtocolDeltas(txs);
    expect(result.deltaOrchard).toEqual(new BigNumber(1_000));
    expect(result.deltaSapling).toEqual(new BigNumber(-2_000));
    expect(result.deltaIronwood).toEqual(new BigNumber(4_000));
  });

  it("ignores internal notes in all pools (no delta)", () => {
    const txs = [
      makeTxWithAllPools(
        [{ amount: new BigNumber(1_000), memo: "", transfer_type: "internal" }],
        [],
        [{ amount: new BigNumber(2_000), memo: "", transfer_type: "internal" }],
      ),
    ];
    const result = computeProtocolDeltas(txs);
    expect(result.deltaOrchard).toEqual(new BigNumber(0));
    expect(result.deltaIronwood).toEqual(new BigNumber(0));
  });
});
