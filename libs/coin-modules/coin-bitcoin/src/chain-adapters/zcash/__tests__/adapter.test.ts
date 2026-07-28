import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { BitcoinAccount, BitcoinOutput, TransactionStatus } from "../../../types";
import type { SignerContext } from "../../../signer";
import type {
  ZcashTransferType,
  ZcashAccount,
  ZcashTransaction,
  SpendableNote,
  DecryptedOutput,
} from "../types";
import { Observable, firstValueFrom } from "rxjs";
import { getChainAdapter } from "../../registry";
import { setZcashShieldedEnabled } from "../constants";

// Load the zcash adapter (side-effect registration)
import "../index";

// ── Helpers ────────────────────────────────────────────────────────────

const mockSignerContext = jest.fn() as unknown as SignerContext;

// Real firmware-generated Orchard-only Unified Address (see address.test.ts).
const UA_ORCHARD_ONLY =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

function makeTx(
  transferType: ZcashTransferType,
  amount: BigNumber = new BigNumber(0),
  extra: Partial<ZcashTransaction> = {},
): ZcashTransaction {
  return {
    family: "bitcoin" as const,
    amount,
    recipient: "",
    useAllAmount: false,
    feePerByte: null,
    networkInfo: null,
    utxoStrategy: { strategy: 0, excludeUTXOs: [] },
    rbf: false,
    transferType,
    ...extra,
  };
}

function makeUtxo(value: BigNumber, overrides: Partial<BitcoinOutput> = {}): BitcoinOutput {
  return {
    hash: "aa".repeat(32),
    outputIndex: 0,
    blockHeight: 1000,
    address: "t1utxoaddress",
    value,
    rbf: false,
    isChange: false,
    ...overrides,
  } as BitcoinOutput;
}

function makeSpendableNote(overrides: Partial<SpendableNote> = {}): SpendableNote {
  return {
    txid: "tx1",
    outputIndex: 0,
    nullifier: "aa".repeat(32),
    amount: new BigNumber(1_000_000),
    rho: "ee".repeat(32),
    rseed: "bb".repeat(32),
    cmx: "cc".repeat(32),
    position: "0",
    recipient: "dd".repeat(43),
    ...overrides,
  };
}

function makeZcashAccount(overrides: Partial<ZcashAccount["privateInfo"]> = {}): Account {
  return {
    currency: { id: "zcash" },
    privateInfo: {
      orchardBalance: new BigNumber(1_000_000),
      saplingBalance: new BigNumber(0),
      ironwoodBalance: new BigNumber(0),
      syncState: "complete" as const,
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "uview1key",
      birthday: null,
      lastSyncTimestamp: null,
      lastProcessedBlock: null,
      transactions: [],
      ...overrides,
    },
  } as unknown as Account;
}

function makeOrchardOutputNote(
  note: SpendableNote,
  extra: Partial<DecryptedOutput> = {},
): DecryptedOutput {
  return {
    amount: note.amount,
    memo: "",
    transfer_type: "incoming",
    isSpent: false,
    nullifier: note.nullifier,
    rho: note.rho,
    rseed: note.rseed,
    cmx: note.cmx,
    position: note.position,
    recipient: note.recipient,
    ...extra,
  };
}

/** Ironwood-pool counterpart of makeOrchardOutputNote. */
function makeIronwoodOutputNote(
  note: SpendableNote,
  extra: Partial<DecryptedOutput> = {},
): DecryptedOutput {
  return {
    amount: note.amount,
    memo: "",
    transfer_type: "incoming",
    isSpent: false,
    nullifier: note.nullifier,
    rho: note.rho,
    rseed: note.rseed,
    cmx: note.cmx,
    position: note.position,
    recipient: note.recipient,
    ...extra,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("zcash chain adapter — transaction routing", () => {
  const adapter = getChainAdapter("zcash");

  // Routing is driven by the zcashShielded feature flag. The suite runs with the
  // flag ON by default (so the shielded PCZT hooks are exercised); the tests that
  // assert the legacy fallback toggle it OFF explicitly. Reset after each test so
  // the module-level flag never leaks across tests.
  beforeEach(() => setZcashShieldedEnabled(true));
  afterEach(() => setZcashShieldedEnabled(false));

  describe("signOperation", () => {
    // Contract: routing is flag-driven, not transferType-driven. flag ON ⇒ every
    // flow (including Public→Public / transparent t→t) goes through PCZT and
    // returns an Observable. flag OFF ⇒ transparent-input flows fall back to the
    // legacy Bitcoin path (undefined); shielded-input flows ("shielded",
    // "shielded-to-transparent") cannot be represented by the legacy path (no
    // Orchard note spends), so they return an error Observable rather than
    // silently producing an invalid transaction.
    describe("zcashShielded flag ON ⇒ every flow returns an Observable (PCZT)", () => {
      beforeEach(() => setZcashShieldedEnabled(true));

      it.each<ZcashTransferType>([
        "transparent",
        "transparent-to-shielded",
        "shielded-to-transparent",
        "shielded",
      ])("returns an Observable (PCZT) for %s transfers", transferType => {
        const result = adapter.signOperation!(
          makeZcashAccount({ ufvk: "testufvk" }),
          "device",
          makeTx(transferType),
          mockSignerContext,
        );
        expect(result).toBeInstanceOf(Observable);
      });
    });

    describe("zcashShielded flag OFF", () => {
      beforeEach(() => setZcashShieldedEnabled(false));

      it.each<ZcashTransferType>(["transparent", "transparent-to-shielded"])(
        "returns undefined (legacy Bitcoin path) for %s transfers",
        transferType => {
          const result = adapter.signOperation!(
            makeZcashAccount({ ufvk: "testufvk" }),
            "device",
            makeTx(transferType),
            mockSignerContext,
          );
          expect(result).toBeUndefined();
        },
      );

      it.each<ZcashTransferType>(["shielded", "shielded-to-transparent"])(
        "returns an error Observable for %s transfers (legacy path cannot represent note spends)",
        async transferType => {
          const result = adapter.signOperation!(
            makeZcashAccount({ ufvk: "testufvk" }),
            "device",
            makeTx(transferType),
            mockSignerContext,
          );
          expect(result).toBeInstanceOf(Observable);
          await expect(firstValueFrom(result as Observable<unknown>)).rejects.toThrow(
            "require the zcashShielded feature to be enabled",
          );
        },
      );

      it.each<ZcashTransferType>(["ironwood", "ironwood-to-transparent"])(
        "returns an error Observable for %s transfers when flag is OFF",
        async transferType => {
          const result = adapter.signOperation!(
            makeZcashAccount({ ufvk: "testufvk" }),
            "device",
            makeTx(transferType),
            mockSignerContext,
          );
          expect(result).toBeInstanceOf(Observable);
          await expect(firstValueFrom(result as Observable<unknown>)).rejects.toThrow(
            "require the zcashShielded feature to be enabled",
          );
        },
      );
    });

    describe("zcashShielded flag ON — Ironwood signing stub", () => {
      it.each<ZcashTransferType>(["ironwood", "ironwood-to-transparent"])(
        "returns an error Observable for %s transfers (finalizeIronwoodTransaction not yet available)",
        async transferType => {
          const result = adapter.signOperation!(
            makeZcashAccount({ ufvk: "testufvk" }),
            "device",
            makeTx(transferType),
            mockSignerContext,
          );
          expect(result).toBeInstanceOf(Observable);
          await expect(firstValueFrom(result as Observable<unknown>)).rejects.toThrow(
            "requires finalizeIronwoodTransaction",
          );
        },
      );
    });
  });

  // Contract check: with the flag OFF, prepareTransaction/getTransactionStatus/
  // estimateMaxSpendable short-circuit to the legacy Bitcoin path (undefined)
  // regardless of transfer type. signOperation follows the same rule for
  // transparent-input flows, but shielded-input flows return an error Observable
  // (asserted in the signOperation suite above) because the legacy path cannot
  // represent Orchard note spends.
  describe("zcashShielded flag OFF ⇒ all hooks fall back to legacy", () => {
    beforeEach(() => setZcashShieldedEnabled(false));

    it.each<ZcashTransferType>([
      "transparent",
      "transparent-to-shielded",
      "shielded-to-transparent",
      "shielded",
      "ironwood",
      "ironwood-to-transparent",
    ])(
      "prepareTransaction/getTransactionStatus/estimateMaxSpendable are undefined for %s",
      transferType => {
        const account = makeZcashAccount({ ufvk: "testufvk" });
        const tx = makeTx(transferType);
        expect(adapter.prepareTransaction!(account, tx)).toBeUndefined();
        expect(adapter.getTransactionStatus!(account, tx)).toBeUndefined();
        expect(adapter.estimateMaxSpendable!(account, undefined, tx)).toBeUndefined();
      },
    );

    it.each<ZcashTransferType>(["transparent", "transparent-to-shielded"])(
      "signOperation is undefined for %s (legacy Bitcoin path)",
      transferType => {
        const account = makeZcashAccount({ ufvk: "testufvk" });
        const tx = makeTx(transferType);
        expect(adapter.signOperation!(account, "device", tx, mockSignerContext)).toBeUndefined();
      },
    );
  });

  // ── prepareTransaction ──────────────────────────────────────────────

  describe("prepareTransaction", () => {
    it("returns undefined for transparent transfers when the flag is OFF (Bitcoin legacy path)", () => {
      setZcashShieldedEnabled(false);
      const result = adapter.prepareTransaction!(makeZcashAccount(), makeTx("transparent"));
      expect(result).toBeUndefined();
    });

    it("returns enriched tx with selectedNotes for a shielded transfer with spendable notes", async () => {
      const note = makeSpendableNote({ amount: new BigNumber(500_000) });
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(500_000),
        transactions: [
          {
            id: "tx1",
            hex: "00",
            blockHeight: 100,
            blockHash: "hash1",
            timestamp: 1700000000,
            fee: new BigNumber(100),
            decryptedData: {
              orchard_outputs: [makeOrchardOutputNote(note)],
              sapling_outputs: [],
            },
          },
        ],
      });

      const tx = makeTx("shielded", new BigNumber(100_000));
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      // 1 note of 500_000, amount 100_000, fee 10_000 (2 grace actions), change 390_000
      expect(result.selectedNotes).toHaveLength(1);
      expect(result.zcashFee?.toNumber()).toBe(10_000);
      expect(result.changeAmount?.toNumber()).toBe(390_000);
    });

    it("returns original tx (no selectedNotes) when insufficient balance", async () => {
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(1_000),
        transactions: [],
      });

      const tx = makeTx("shielded", new BigNumber(999_999));
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      // selectNotes returns undefined -> prepareTransaction sets selectedNotes: []
      expect(result.selectedNotes).toEqual([]);
      expect(result.transferType).toBe("shielded");
    });

    it("handles useAllAmount by computing effective amount from max spendable", async () => {
      const note = makeSpendableNote({ amount: new BigNumber(500_000) });
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(500_000),
        transactions: [
          {
            id: "tx1",
            hex: "00",
            blockHeight: 100,
            blockHash: "hash1",
            timestamp: 1700000000,
            fee: new BigNumber(100),
            decryptedData: {
              orchard_outputs: [makeOrchardOutputNote(note)],
              sapling_outputs: [],
            },
          },
        ],
      });

      const tx = makeTx("shielded", new BigNumber(0), { useAllAmount: true });
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      // 1 note of 500_000, fee = 10_000 (2 grace actions), max spendable = 490_000
      expect(result.amount.toNumber()).toBe(490_000);
      expect(result.selectedNotes).toHaveLength(1);
      expect(result.zcashFee?.toNumber()).toBe(10_000);
      expect(result.changeAmount?.toNumber()).toBe(0);
    });

    it("enriches transparent-to-shielded with fee/change from transparent UTXOs (no note spends)", async () => {
      const account = makeZcashAccount({ transactions: [] });
      const tx = makeTx("transparent-to-shielded", new BigNumber(100_000), {
        recipient: UA_ORCHARD_ONLY,
        selectedUtxos: [makeUtxo(new BigNumber(1_000_000))],
      });
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      // 1 t-in + Orchard recipient + shielded change: orchard = max(2, 2) = 2;
      // transparent = 1; logical = 3 → fee = 15_000.
      // change = 1_000_000 - 100_000 - 15_000 = 885_000. No Orchard note spends.
      expect(result.selectedNotes).toEqual([]);
      expect(result.zcashFee?.toNumber()).toBe(15_000);
      expect(result.changeAmount?.toNumber()).toBe(885_000);
    });

    it("computes transparent-to-shielded useAllAmount as balance minus fee (no change)", async () => {
      const account = makeZcashAccount({ transactions: [] });
      const tx = makeTx("transparent-to-shielded", new BigNumber(0), {
        recipient: UA_ORCHARD_ONLY,
        useAllAmount: true,
        selectedUtxos: [makeUtxo(new BigNumber(1_000_000))],
      });
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      // 1 t-in + single Orchard recipient: orchard = max(2, 1) = 2; transparent = 1;
      // logical = 3 → fee = 15_000. amount = 1_000_000 - 15_000 = 985_000.
      expect(result.amount.toNumber()).toBe(985_000);
      expect(result.zcashFee?.toNumber()).toBe(15_000);
      expect(result.changeAmount?.toNumber()).toBe(0);
      expect(result.selectedNotes).toEqual([]);
    });

    it("returns transparent-to-shielded with empty notes when balance is insufficient", async () => {
      const account = makeZcashAccount({ transactions: [] });
      const tx = makeTx("transparent-to-shielded", new BigNumber(100_000), {
        recipient: UA_ORCHARD_ONLY,
        selectedUtxos: [makeUtxo(new BigNumber(1_000))],
      });
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      expect(result.selectedNotes).toEqual([]);
      expect(result.zcashFee).toBeUndefined();
    });

    it("returns a Promise for shielded-to-transparent (no spendable notes)", async () => {
      const account = makeZcashAccount({ transactions: [] });
      const tx = makeTx("shielded-to-transparent", new BigNumber(1000));
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;
      expect(result.selectedNotes).toEqual([]);
    });

    it("returns enriched tx with selectedNotes for an ironwood transfer with spendable notes", async () => {
      const note = makeSpendableNote({
        nullifier: "11".repeat(32),
        amount: new BigNumber(500_000),
      });
      const account = makeZcashAccount({
        ironwoodBalance: new BigNumber(500_000),
        transactions: [
          {
            id: "tx-iw",
            hex: "00",
            blockHeight: 100,
            blockHash: "hash-iw",
            timestamp: 1_700_000_000,
            fee: new BigNumber(100),
            decryptedData: {
              orchard_outputs: [],
              sapling_outputs: [],
              ironwood_outputs: [makeIronwoodOutputNote(note)],
            },
          },
        ],
      });

      const tx = makeTx("ironwood", new BigNumber(100_000));
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      // 1 ironwood note, amount 100_000, fee 10_000 (grace floor), change 390_000
      expect(result.selectedNotes).toHaveLength(1);
      expect(result.zcashFee?.toNumber()).toBe(10_000);
      expect(result.changeAmount?.toNumber()).toBe(390_000);
    });

    it("returns empty selectedNotes for ironwood when balance is zero", async () => {
      const account = makeZcashAccount({
        ironwoodBalance: new BigNumber(0),
        transactions: [],
      });

      const tx = makeTx("ironwood", new BigNumber(100_000));
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      expect(result.selectedNotes).toEqual([]);
      expect(result.transferType).toBe("ironwood");
    });

    it("does not use Orchard notes for ironwood transfer type", async () => {
      // An account with orchard notes but zero ironwood notes — ironwood should
      // return empty selectedNotes, not accidentally pick orchard notes.
      const orchardNote = makeSpendableNote({ amount: new BigNumber(1_000_000) });
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(1_000_000),
        ironwoodBalance: new BigNumber(0),
        transactions: [
          {
            id: "tx-orchard",
            hex: "00",
            blockHeight: 100,
            blockHash: "hash-orchard",
            timestamp: 1_700_000_000,
            fee: new BigNumber(100),
            decryptedData: {
              orchard_outputs: [makeOrchardOutputNote(orchardNote)],
              sapling_outputs: [],
            },
          },
        ],
      });

      const tx = makeTx("ironwood", new BigNumber(100_000));
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;

      // ironwood has no notes → selectNotes returns undefined → empty selectedNotes
      expect(result.selectedNotes).toEqual([]);
    });
  });

  // ── getTransactionStatus ───────────────────────────────────────────

  describe("getTransactionStatus", () => {
    it("returns undefined for transparent transfers when the flag is OFF (Bitcoin legacy path)", () => {
      setZcashShieldedEnabled(false);
      const result = adapter.getTransactionStatus!(makeZcashAccount(), makeTx("transparent"));
      expect(result).toBeUndefined();
    });

    it("returns error when no privateInfo (sync not complete)", async () => {
      const account = { currency: { id: "zcash" } } as unknown as Account;
      const tx = makeTx("shielded", new BigNumber(1000));
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.account).toBeInstanceOf(Error);
      expect(result.errors.account.message).toContain("Shielded sync not complete");
    });

    it("returns error when amount <= 0", async () => {
      const note = makeSpendableNote({ amount: new BigNumber(500_000) });
      const account = makeZcashAccount({ orchardBalance: new BigNumber(500_000) });
      const tx = makeTx("shielded", new BigNumber(0), {
        selectedNotes: [note],
        zcashFee: new BigNumber(10_000),
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.amount).toBeInstanceOf(Error);
      expect(result.errors.amount.message).toContain("Amount must be positive");
    });

    it("returns error for insufficient shielded balance", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(5_000) });
      const tx = makeTx("shielded", new BigNumber(100_000), {
        selectedNotes: [makeSpendableNote()],
        zcashFee: new BigNumber(10_000),
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.amount).toBeInstanceOf(Error);
      expect(result.errors.amount.message).toContain("Insufficient shielded balance");
    });

    it("returns insufficient balance error when selectedNotes is empty", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(500_000) });
      const tx = makeTx("shielded", new BigNumber(100_000), {
        zcashFee: new BigNumber(10_000),
        selectedNotes: [],
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.amount).toBeInstanceOf(Error);
      expect(result.errors.amount.message).toContain("Insufficient shielded balance");
    });

    it("returns recipient error for shielded-to-transparent without recipient", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(500_000) });
      const tx = makeTx("shielded-to-transparent", new BigNumber(100_000), {
        selectedNotes: [makeSpendableNote()],
        zcashFee: new BigNumber(10_000),
      });
      // recipient is "" (empty) from makeTx
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.recipient).toBeInstanceOf(Error);
    });

    it("returns recipient error for shielded (private -> private) without recipient", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(500_000) });
      // Selecting the private balance with an empty address derives transferType
      // "shielded"; the recipient step must not be considered valid.
      const tx = makeTx("shielded", new BigNumber(100_000), {
        selectedNotes: [makeSpendableNote()],
        zcashFee: new BigNumber(10_000),
      });
      // recipient is "" (empty) from makeTx
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.recipient).toBeInstanceOf(Error);
    });

    it("returns insufficient balance error when selectedNotes is undefined (prepareTransaction not called)", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(500_000) });
      // No selectedNotes at all — tx was not prepared
      const tx = makeTx("shielded", new BigNumber(100_000), {
        zcashFee: new BigNumber(10_000),
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.amount).toBeInstanceOf(Error);
      expect(result.errors.amount.message).toContain("Insufficient shielded balance");
    });

    it("returns error when selectedNotes do not cover amount + fee", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(500_000) });
      // amount(100k) + fee(10k) = 110k, but selectedNotes only total 50k
      const tx = makeTx("shielded", new BigNumber(100_000), {
        selectedNotes: [makeSpendableNote({ amount: new BigNumber(50_000) })],
        zcashFee: new BigNumber(10_000),
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.amount).toBeInstanceOf(Error);
      expect(result.errors.amount.message).toContain("Selected notes do not cover amount + fee");
    });

    it("returns no errors for a valid shielded transaction", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(500_000) });
      const tx = makeTx("shielded", new BigNumber(100_000), {
        recipient: UA_ORCHARD_ONLY,
        selectedNotes: [makeSpendableNote({ amount: new BigNumber(120_000) })],
        zcashFee: new BigNumber(10_000),
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.estimatedFees.toNumber()).toBe(10_000);
      expect(result.totalSpent.toNumber()).toBe(110_000);
    });

    it("uses default fee of 10_000 when zcashFee is not set on tx", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(500_000) });
      const tx = makeTx("shielded", new BigNumber(100_000), {
        selectedNotes: [makeSpendableNote({ amount: new BigNumber(200_000) })],
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.estimatedFees.toNumber()).toBe(10_000);
      expect(result.totalSpent.toNumber()).toBe(110_000);
    });

    it("returns no errors for a valid transparent-to-shielded transaction", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(0) });
      const tx = makeTx("transparent-to-shielded", new BigNumber(100_000), {
        recipient: UA_ORCHARD_ONLY,
        zcashFee: new BigNumber(15_000),
        selectedUtxos: [makeUtxo(new BigNumber(1_000_000))],
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.estimatedFees.toNumber()).toBe(15_000);
      expect(result.totalSpent.toNumber()).toBe(115_000);
    });

    it("returns NotEnoughBalance for transparent-to-shielded exceeding the transparent balance", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(0) });
      const tx = makeTx("transparent-to-shielded", new BigNumber(100_000), {
        recipient: UA_ORCHARD_ONLY,
        zcashFee: new BigNumber(15_000),
        selectedUtxos: [makeUtxo(new BigNumber(50_000))],
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.amount).toBeInstanceOf(Error);
      expect(result.errors.amount.name).toBe("NotEnoughBalance");
    });

    it("returns recipient error for transparent-to-shielded without recipient", async () => {
      const account = makeZcashAccount({ orchardBalance: new BigNumber(0) });
      const tx = makeTx("transparent-to-shielded", new BigNumber(100_000), {
        zcashFee: new BigNumber(15_000),
        selectedUtxos: [makeUtxo(new BigNumber(1_000_000))],
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.recipient).toBeInstanceOf(Error);
    });

    it("validates against ironwoodBalance for ironwood transfer type", async () => {
      const account = makeZcashAccount({
        ironwoodBalance: new BigNumber(5_000),
        orchardBalance: new BigNumber(0),
      });
      // amount(10k) + fee(10k) = 20k exceeds ironwoodBalance(5k)
      const tx = makeTx("ironwood", new BigNumber(10_000), {
        selectedNotes: [makeSpendableNote({ amount: new BigNumber(5_000) })],
        zcashFee: new BigNumber(10_000),
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(result.errors.amount).toBeInstanceOf(Error);
      expect(result.errors.amount.message).toContain("Insufficient shielded balance");
    });

    it("returns no errors for a valid ironwood transaction", async () => {
      const account = makeZcashAccount({
        ironwoodBalance: new BigNumber(500_000),
        orchardBalance: new BigNumber(0),
      });
      const tx = makeTx("ironwood", new BigNumber(100_000), {
        recipient: UA_ORCHARD_ONLY,
        selectedNotes: [makeSpendableNote({ amount: new BigNumber(120_000) })],
        zcashFee: new BigNumber(10_000),
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.estimatedFees.toNumber()).toBe(10_000);
      expect(result.totalSpent.toNumber()).toBe(110_000);
    });

    it("does not validate ironwood against orchardBalance (pools are independent)", async () => {
      // orchardBalance is huge but ironwoodBalance is tiny — ironwood tx must
      // be validated against ironwoodBalance, not orchardBalance.
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(10_000_000),
        ironwoodBalance: new BigNumber(5_000),
      });
      const tx = makeTx("ironwood", new BigNumber(100_000), {
        selectedNotes: [makeSpendableNote({ amount: new BigNumber(5_000) })],
        zcashFee: new BigNumber(10_000),
      });
      const result = (await adapter.getTransactionStatus!(account, tx)) as TransactionStatus;

      // Should fail against ironwoodBalance(5k), not succeed against orchardBalance(10M)
      expect(result.errors.amount).toBeInstanceOf(Error);
    });
  });

  // ── computeAccountBalance ──────────────────────────────────────

  describe("computeAccountBalance", () => {
    it("returns transparent + private (orchard + sapling)", () => {
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(5_000),
        saplingBalance: new BigNumber(2_000),
      }) as unknown as BitcoinAccount;
      const result = adapter.computeAccountBalance!(account, new BigNumber(10_000));
      expect(result).toEqual(new BigNumber(17_000));
    });

    it("returns the transparent balance when there is no privateInfo", () => {
      const account = { currency: { id: "zcash" } } as unknown as BitcoinAccount;
      const result = adapter.computeAccountBalance!(account, new BigNumber(10_000));
      expect(result).toEqual(new BigNumber(10_000));
    });

    it("includes ironwoodBalance in the total", () => {
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(5_000),
        saplingBalance: new BigNumber(2_000),
        ironwoodBalance: new BigNumber(3_000),
      }) as unknown as BitcoinAccount;
      const result = adapter.computeAccountBalance!(account, new BigNumber(10_000));
      expect(result).toEqual(new BigNumber(20_000));
    });
  });

  // ── estimateMaxSpendable ───────────────────────────────────────────

  describe("estimateMaxSpendable", () => {
    it("returns undefined for transparent transfers when the flag is OFF", () => {
      setZcashShieldedEnabled(false);
      const result = adapter.estimateMaxSpendable!(
        makeZcashAccount(),
        undefined,
        makeTx("transparent"),
      );
      expect(result).toBeUndefined();
    });

    it("returns correct max spendable for shielded transfer with notes", async () => {
      const note = makeSpendableNote({ amount: new BigNumber(500_000) });
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(500_000),
        transactions: [
          {
            id: "tx1",
            hex: "00",
            blockHeight: 100,
            blockHash: "hash1",
            timestamp: 1700000000,
            fee: new BigNumber(100),
            decryptedData: {
              orchard_outputs: [makeOrchardOutputNote(note)],
              sapling_outputs: [],
            },
          },
        ],
      });

      const result = (await adapter.estimateMaxSpendable!(
        account,
        undefined,
        makeTx("shielded"),
      )) as BigNumber;
      // 500_000 - fee(1 spend, 1 output = max(1,1)=1, clamped to 2 grace) = 500_000 - 10_000
      expect(result.toNumber()).toBe(490_000);
    });

    it("returns 0 when no spendable notes", async () => {
      const account = makeZcashAccount({ transactions: [] });
      const result = (await adapter.estimateMaxSpendable!(
        account,
        undefined,
        makeTx("shielded"),
      )) as BigNumber;
      expect(result.toNumber()).toBe(0);
    });

    it("defaults to shielded when transaction is null", async () => {
      const account = makeZcashAccount({ transactions: [] });
      const result = (await adapter.estimateMaxSpendable!(account, undefined, null)) as BigNumber;
      expect(result).toBeUndefined();
    });

    it("returns transparent balance minus shielding fee for transparent-to-shielded", async () => {
      const account = makeZcashAccount({ transactions: [] });
      const tx = makeTx("transparent-to-shielded", new BigNumber(0), {
        selectedUtxos: [makeUtxo(new BigNumber(1_000_000))],
      });
      const result = (await adapter.estimateMaxSpendable!(account, undefined, tx)) as BigNumber;
      // 1 t-in + 1 Orchard recipient: orchard = max(2, 1) = 2; transparent = 1;
      // logical = 3 → fee = 15_000.
      expect(result.toNumber()).toBe(985_000);
    });

    it("returns max spendable from ironwood notes for ironwood transfer type", async () => {
      const note = makeSpendableNote({
        nullifier: "11".repeat(32),
        amount: new BigNumber(500_000),
      });
      const account = makeZcashAccount({
        ironwoodBalance: new BigNumber(500_000),
        orchardBalance: new BigNumber(0),
        transactions: [
          {
            id: "tx-iw",
            hex: "00",
            blockHeight: 100,
            blockHash: "hash-iw",
            timestamp: 1_700_000_000,
            fee: new BigNumber(0),
            decryptedData: {
              orchard_outputs: [],
              sapling_outputs: [],
              ironwood_outputs: [makeIronwoodOutputNote(note)],
            },
          },
        ],
      });

      const result = (await adapter.estimateMaxSpendable!(
        account,
        undefined,
        makeTx("ironwood"),
      )) as BigNumber;
      // 1 spend, ironwood: floor 2 actions → fee = 10_000; max = 490_000
      expect(result.toNumber()).toBe(490_000);
    });

    it("returns 0 for ironwood when there are no ironwood notes", async () => {
      const account = makeZcashAccount({
        ironwoodBalance: new BigNumber(0),
        transactions: [],
      });
      const result = (await adapter.estimateMaxSpendable!(
        account,
        undefined,
        makeTx("ironwood"),
      )) as BigNumber;
      expect(result.toNumber()).toBe(0);
    });

    it("does not use orchard notes for ironwood transfer type", async () => {
      // Account with a large orchard balance but no ironwood notes — ironwood
      // estimate must be 0, not accidentally use orchard notes.
      const orchardNote = makeSpendableNote({ amount: new BigNumber(2_000_000) });
      const account = makeZcashAccount({
        orchardBalance: new BigNumber(2_000_000),
        ironwoodBalance: new BigNumber(0),
        transactions: [
          {
            id: "tx-orchard",
            hex: "00",
            blockHeight: 100,
            blockHash: "hash-orchard",
            timestamp: 1_700_000_000,
            fee: new BigNumber(0),
            decryptedData: {
              orchard_outputs: [makeOrchardOutputNote(orchardNote)],
              sapling_outputs: [],
            },
          },
        ],
      });

      const result = (await adapter.estimateMaxSpendable!(
        account,
        undefined,
        makeTx("ironwood"),
      )) as BigNumber;
      expect(result.toNumber()).toBe(0);
    });
  });
});
