import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { reduceShieldedSyncResult, postSync } from "./sync";
import {
  reserveNotes,
  getSessionReservedNullifiers,
  _resetReservationsForTest,
} from "./note-reservation";
import type { ZcashAccount, ZcashOperationExtra } from "../types/bridge";
import type { ShieldedSyncResult, ShieldedTransaction } from "../network/types";
import type { BtcOperation } from "../types/bridge";

jest.mock("../logic/engineClient", () => ({
  getZCashModule: jest.fn(),
  getZCashClient: jest.fn(),
}));

const currency = getCryptoCurrencyById("zcash");

/** The transparent balance is derived from the UTXOs, so back it with one. */
const infoWith = (privateInfo: Partial<ZcashAccount["privateInfo"]>, transparent = 0): any => ({
  currency,
  address: "zs1test",
  index: 0,
  derivationPath: "44'/133'/0'/0'",
  derivationMode: 0,
  initialAccount: {
    bitcoinResources: { utxos: transparent > 0 ? [{ value: new BigNumber(transparent) }] : [] },
    privateInfo: {
      orchardBalance: new BigNumber(0),
      saplingBalance: new BigNumber(0),
      ironwoodBalance: new BigNumber(0),
      syncState: "running" as const,
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "uview1key",
      birthday: null,
      shieldedAddress: null,
      lastSyncTimestamp: null,
      lastProcessedBlock: null,
      transactions: [],
      ...privateInfo,
    },
  },
});

const incomingTx = (blockHeight: number, amount: number): ShieldedTransaction => ({
  id: `tx-${blockHeight}`,
  hex: "00",
  blockHeight,
  blockHash: "hash",
  timestamp: 1_700_000_000,
  fee: new BigNumber(0),
  decryptedData: {
    orchard_outputs: [
      { amount: new BigNumber(amount), memo: "", transfer_type: "incoming", isSpent: false },
    ],
    sapling_outputs: [],
  },
});

const ironwoodTx = (
  blockHeight: number,
  amount: number,
  nullifier?: string,
): ShieldedTransaction => ({
  id: `tx-iw-${blockHeight}`,
  hex: "00",
  blockHeight,
  blockHash: "hash",
  timestamp: 1_700_000_000,
  fee: new BigNumber(0),
  decryptedData: {
    orchard_outputs: [],
    sapling_outputs: [],
    ironwood_outputs: [
      {
        amount: new BigNumber(amount),
        memo: "",
        transfer_type: "incoming",
        isSpent: false,
        ...(nullifier && { nullifier }),
      },
    ],
  },
});

describe("reduceShieldedSyncResult", () => {
  const emptyChunk: ShieldedSyncResult = {
    transactions: [],
    processedBlocks: 0,
    remainingBlocks: 0,
  };

  // Ironwood notes are as spendable as UTXOs. Reporting only the transparent
  // balance here shows an account holding nothing but notes as having nothing to
  // spend. (Orchard/Sapling are deprecated and excluded — see balance.ts.)
  it("counts the spendable Ironwood pool as spendable, not just as balance", () => {
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: {} },
      { ...emptyChunk, transactions: [ironwoodTx(3_425_869, 50_000)] },
      infoWith({}, 100_000),
      "acc-1",
    );

    expect(output.accountUpdate.balance).toEqual(new BigNumber(150_000));
    expect(output.accountUpdate.spendableBalance).toEqual(new BigNumber(150_000));
  });

  // A synced account polls a chain it is already at the tip of, and the engine then
  // reports a chunk that scanned nothing and carries no cursor. Persisting that as
  // `null` sends the next sync back to the account birthday, re-processing the whole
  // shielded history poll after poll.
  describe("scan cursor", () => {
    it("keeps the stored cursor when a chunk reports no progress", () => {
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        emptyChunk,
        infoWith({ lastProcessedBlock: 3_425_868 }),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.lastProcessedBlock).toBe(3_425_868);
    });

    it("keeps the stored cursor when a chunk with new transactions reports no progress", () => {
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        { ...emptyChunk, transactions: [incomingTx(3_425_869, 1000)] },
        infoWith({ lastProcessedBlock: 3_425_868 }),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.lastProcessedBlock).toBe(3_425_868);
    });

    it("advances the cursor when a chunk reports a further block", () => {
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        { ...emptyChunk, lastProcessedBlock: 3_425_900 },
        infoWith({ lastProcessedBlock: 3_425_868 }),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.lastProcessedBlock).toBe(3_425_900);
    });

    it("never moves the cursor backwards", () => {
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        { ...emptyChunk, lastProcessedBlock: 1000 },
        infoWith({ lastProcessedBlock: 3_425_868 }),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.lastProcessedBlock).toBe(3_425_868);
    });

    it("adopts the reported block when no cursor was stored yet", () => {
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        { ...emptyChunk, lastProcessedBlock: 3_425_900 },
        infoWith({ lastProcessedBlock: null }),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.lastProcessedBlock).toBe(3_425_900);
    });
  });

  describe("ironwood pool", () => {
    it("computes the ironwood balance from the notes a chunk discovered", () => {
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        { ...emptyChunk, transactions: [ironwoodTx(3_425_869, 5_000_000)] },
        infoWith({}),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.ironwoodBalance).toEqual(new BigNumber(5_000_000));
      expect(output.accountUpdate.balance).toEqual(new BigNumber(5_000_000));
    });

    // Each pool's notes are discovered and tracked independently, ironwood never
    // shadowing orchard. The reported balance, though, counts only the spendable
    // Ironwood pool plus the transparent UTXOs — the deprecated Orchard notes are
    // tracked but left out of the total (see balance.ts).
    it("tracks ironwood alongside orchard while only ironwood and the UTXOs count", () => {
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        {
          ...emptyChunk,
          transactions: [incomingTx(3_425_869, 2_000_000), ironwoodTx(3_425_870, 3_000_000)],
        },
        infoWith({}, 1_000_000),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(2_000_000));
      expect(output.accountUpdate.privateInfo?.ironwoodBalance).toEqual(new BigNumber(3_000_000));
      expect(output.accountUpdate.balance).toEqual(new BigNumber(4_000_000));
    });

    // The engine reports the nullifiers it saw spent in a single list covering
    // every pool, so an ironwood note has to be recognised in it like an orchard one.
    it("marks an ironwood note spent when the engine reports its nullifier", () => {
      const nullifier = "cc".repeat(32);
      const stored = ironwoodTx(3_425_868, 2_000_000, nullifier);

      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        { ...emptyChunk, spentKnownNullifiers: [nullifier] },
        infoWith({ ironwoodBalance: new BigNumber(2_000_000), transactions: [stored] }),
        "acc-1",
      );

      const notes =
        output.accountUpdate.privateInfo?.transactions?.[0].decryptedData?.ironwood_outputs;
      expect(notes?.[0].isSpent).toBe(true);
      expect(output.accountUpdate.privateInfo?.ironwoodBalance).toEqual(new BigNumber(0));
      expect(output.accountUpdate.balance).toEqual(new BigNumber(0));
    });

    // The next sync gathers its knownNullifiers from the stored transactions, so a
    // dropped ironwood note would make the engine miss that it was spent.
    it("keeps the ironwood notes of a stored transaction, nullifier included", () => {
      const nullifier = "dd".repeat(32);

      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        { ...emptyChunk, transactions: [ironwoodTx(3_425_869, 1_000_000, nullifier)] },
        infoWith({}),
        "acc-1",
      );

      const notes =
        output.accountUpdate.privateInfo?.transactions?.[0].decryptedData?.ironwood_outputs;
      expect(notes).toHaveLength(1);
      expect(notes?.[0].nullifier).toBe(nullifier);
    });
  });

  // Dropping the nullifiers a scan reported spent is what keeps the session
  // reservation store from growing forever, and the reducer is its only caller —
  // one per branch, the chunk that discovered transactions and the chunk that did
  // not. Both are covered here against the real store, since a mis-threaded
  // argument is the regression that silently defeats the cleanup.
  describe("reservation reconciliation", () => {
    const RESERVED_A = "11".repeat(32);
    const RESERVED_B = "22".repeat(32);

    beforeEach(() => {
      _resetReservationsForTest();
    });

    describe.each([
      { branch: "without new transactions", transactions: [] as ShieldedTransaction[] },
      { branch: "carrying new transactions", transactions: [incomingTx(3_425_869, 1000)] },
    ])("on a chunk $branch", ({ transactions }) => {
      it("drops the nullifiers the scan reported spent", () => {
        reserveNotes("acc-1", "tx-in-flight", [RESERVED_A, RESERVED_B]);

        reduceShieldedSyncResult(
          { processedOperations: [], accountUpdate: {} },
          {
            ...emptyChunk,
            transactions,
            processedBlocks: 10,
            remainingBlocks: 5,
            spentKnownNullifiers: [RESERVED_A],
          },
          infoWith({}),
          "acc-1",
        );

        const reserved = getSessionReservedNullifiers("acc-1");
        expect(reserved.has(RESERVED_A)).toBe(false);
        expect(reserved.has(RESERVED_B)).toBe(true);
      });

      // Reaching the tip a run started from is the outcome of nearly every poll
      // of an account that is not backlogged. It confirms nothing about a spend
      // in flight, so it must not hand its notes back to the next send.
      it("keeps a reservation the scan said nothing about, tip or no tip", () => {
        reserveNotes("acc-1", "tx-in-flight", [RESERVED_A, RESERVED_B]);

        reduceShieldedSyncResult(
          { processedOperations: [], accountUpdate: {} },
          { ...emptyChunk, transactions, processedBlocks: 15, remainingBlocks: 0 },
          infoWith({}),
          "acc-1",
        );

        expect(getSessionReservedNullifiers("acc-1").size).toBe(2);
      });

      it("keeps the reservations of the accounts it is not syncing", () => {
        reserveNotes("acc-1", "tx-in-flight", [RESERVED_A]);
        reserveNotes("acc-2", "tx-elsewhere", [RESERVED_B]);

        reduceShieldedSyncResult(
          { processedOperations: [], accountUpdate: {} },
          {
            ...emptyChunk,
            transactions,
            processedBlocks: 15,
            remainingBlocks: 0,
            spentKnownNullifiers: [RESERVED_A],
          },
          infoWith({}),
          "acc-1",
        );

        expect(getSessionReservedNullifiers("acc-1").size).toBe(0);
        expect(getSessionReservedNullifiers("acc-2").has(RESERVED_B)).toBe(true);
      });
    });
  });

  describe("shieldedAddress carry-forward", () => {
    it("preserves a non-null shieldedAddress across a sync cycle", () => {
      const address = "u1testaddress";
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        emptyChunk,
        infoWith({ shieldedAddress: address }),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.shieldedAddress).toBe(address);
    });

    it("carries null when no shieldedAddress was stored", () => {
      const output = reduceShieldedSyncResult(
        { processedOperations: [], accountUpdate: {} },
        emptyChunk,
        infoWith({ shieldedAddress: null }),
        "acc-1",
      );

      expect(output.accountUpdate.privateInfo?.shieldedAddress).toBeNull();
    });
  });
});

describe("postSync", () => {
  const operation = (overrides: Partial<BtcOperation>): BtcOperation =>
    ({
      id: "op-1",
      hash: "76ec3b38",
      accountId: "acc-1",
      type: "OUT",
      value: new BigNumber(1000),
      fee: new BigNumber(55),
      senders: [],
      recipients: [],
      blockHeight: 90,
      blockHash: "hash",
      date: new Date(),
      extra: {},
      ...overrides,
    }) as BtcOperation;

  const account = (operations: BtcOperation[], pendingOperations: BtcOperation[]): ZcashAccount =>
    ({ id: "acc-1", operations, pendingOperations }) as unknown as ZcashAccount;

  // The optimistic operation is an `OUT`, the confirmed one carries the shielded
  // type the scan derived, so the ids never match and the pending entry outlives
  // its own confirmation. The hash is what identifies them.
  it("drops an optimistic operation once its transaction is confirmed", () => {
    const confirmed = operation({ id: "js:2:zcash:x:-76ec3b38-SHIELDED_TX_ORCHARD_OUT" });
    const optimistic = operation({ id: "js:2:zcash:x:-76ec3b38-OUT", recipients: ["u1payee"] });

    const synced = postSync(account([], []), account([confirmed], [optimistic]));

    expect(synced.pendingOperations).toEqual([]);
  });

  // The recovered destination is the receiver found in the transaction, which for
  // a unified address bundling several receivers is the same destination written
  // differently. What the user typed is the more faithful answer.
  it("keeps the address the user entered over the recovered one", () => {
    const confirmed = operation({ recipients: ["u1recovered"] });
    const optimistic = operation({ id: "op-pending", recipients: ["u1astyped"] });

    const synced = postSync(account([], []), account([confirmed], [optimistic]));

    expect(synced.operations[0].recipients).toEqual(["u1astyped"]);
  });

  it("leaves the incoming leg of the same transaction alone", () => {
    const incoming = operation({ type: "SHIELDED_TX_ORCHARD_IN", recipients: ["zs1ourown"] });
    const optimistic = operation({ id: "op-pending", recipients: ["u1astyped"] });

    const synced = postSync(account([], []), account([incoming], [optimistic]));

    expect(synced.operations[0].recipients).toEqual(["zs1ourown"]);
  });

  it("leaves an optimistic operation still in flight alone", () => {
    const optimistic = operation({ id: "op-pending", hash: "unconfirmed" });

    const synced = postSync(account([], []), account([], [optimistic]));

    expect(synced.pendingOperations).toEqual([optimistic]);
  });

  // ── memo propagation ─────────────────────────────────────────────────

  it("copies the optimistic memo to a confirmed operation that has none", () => {
    const confirmed = operation({ extra: {} as ZcashOperationExtra });
    const optimistic = operation({
      id: "op-pending",
      extra: { zcashShielded: true, memo: "shielded memo" } as ZcashOperationExtra,
    });

    const synced = postSync(account([], []), account([confirmed], [optimistic]));

    expect((synced.operations[0].extra as ZcashOperationExtra).memo).toBe("shielded memo");
  });

  it("preserves a memo already present on the confirmed operation", () => {
    const confirmed = operation({
      extra: { zcashShielded: true, memo: "decoded by LWD" } as ZcashOperationExtra,
    });
    const optimistic = operation({
      id: "op-pending",
      extra: { zcashShielded: true, memo: "signed memo" } as ZcashOperationExtra,
    });

    const synced = postSync(account([], []), account([confirmed], [optimistic]));

    expect((synced.operations[0].extra as ZcashOperationExtra).memo).toBe("decoded by LWD");
  });

  // The notes a shielded send spends are released on the same evidence that
  // retires its optimistic operation, so that a second send can reuse them only
  // once the first one is genuinely out of the way.
  describe("note reservations", () => {
    const RESERVED = "11".repeat(32);

    beforeEach(() => {
      _resetReservationsForTest();
    });

    it("releases the notes of a send that has confirmed", () => {
      reserveNotes("acc-1", "76ec3b38", [RESERVED]);
      const confirmed = operation({ hash: "76ec3b38", type: "SHIELDED_TX_ORCHARD_OUT" });

      postSync(account([], []), account([confirmed], []));

      expect(getSessionReservedNullifiers("acc-1").size).toBe(0);
    });

    // The double-spend race the reservation store exists for: a sync lands
    // between two sends, and the first one has not confirmed yet.
    it("holds the notes of a send no confirmed operation accounts for", () => {
      reserveNotes("acc-1", "76ec3b38", [RESERVED]);
      const unrelated = operation({ hash: "0e1d2c3b", type: "SHIELDED_TX_ORCHARD_IN" });
      const optimistic = operation({ id: "op-pending", hash: "76ec3b38" });

      postSync(account([], []), account([unrelated], [optimistic]));

      expect(getSessionReservedNullifiers("acc-1").has(RESERVED)).toBe(true);
    });

    // A scan of an account carries no pending operation at all, and a send is
    // only pending from broadcast onwards while its notes are reserved from
    // signing — an empty pending list is no evidence of anything.
    it("holds the notes of a send that is not pending yet", () => {
      reserveNotes("acc-1", "76ec3b38", [RESERVED]);

      postSync(account([], []), account([], []));

      expect(getSessionReservedNullifiers("acc-1").has(RESERVED)).toBe(true);
    });
  });
});
