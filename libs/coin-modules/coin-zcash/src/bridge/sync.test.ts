import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { reduceShieldedSyncResult, postSync } from "./sync";
import type { ZcashAccount } from "../types/bridge";
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
});
