import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { BitcoinAccount, TransactionStatus } from "../../../types";
import type { SignerContext } from "../../../signer";
import type {
  ZcashTransferType,
  ZcashAccount,
  ZcashTransaction,
  SpendableNote,
  DecryptedOutput,
} from "../types";
import { getChainAdapter } from "../../registry";

// Load the zcash adapter (side-effect registration)
import "../index";

// ── Helpers ────────────────────────────────────────────────────────────

const mockSignerContext = jest.fn() as unknown as SignerContext;

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

// ── Tests ──────────────────────────────────────────────────────────────

describe("zcash chain adapter — transaction routing", () => {
  const adapter = getChainAdapter("zcash");

  // signOperation is not yet implemented — returns undefined for all transfer types
  describe("signOperation", () => {
    const allTransferTypes: ZcashTransferType[] = [
      "transparent",
      "transparent-to-shielded",
      "shielded-to-transparent",
      "shielded",
    ];
    it.each<ZcashTransferType>(allTransferTypes)(
      "returns undefined for %s transactions (PCZT not yet implemented)",
      transferType => {
        const result = adapter.signOperation!(
          makeZcashAccount(),
          "device",
          makeTx(transferType),
          mockSignerContext,
        );
        expect(result).toBeUndefined();
      },
    );
  });

  // ── prepareTransaction ──────────────────────────────────────────────

  describe("prepareTransaction", () => {
    it("returns undefined for transparent transfers (Bitcoin legacy path)", () => {
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

    it("returns undefined for transparent-to-shielded (Bitcoin legacy path)", () => {
      const account = makeZcashAccount({ transactions: [] });
      const tx = makeTx("transparent-to-shielded", new BigNumber(1000));
      const result = adapter.prepareTransaction!(account, tx);
      expect(result).toBeUndefined();
    });

    it("returns a Promise for shielded-to-transparent (no spendable notes)", async () => {
      const account = makeZcashAccount({ transactions: [] });
      const tx = makeTx("shielded-to-transparent", new BigNumber(1000));
      const result = (await adapter.prepareTransaction!(account, tx)) as ZcashTransaction;
      expect(result.selectedNotes).toEqual([]);
    });
  });

  // ── getTransactionStatus ───────────────────────────────────────────

  describe("getTransactionStatus", () => {
    it("returns undefined for transparent transfers (Bitcoin legacy path)", () => {
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
      expect(result.errors.recipient.message).toContain("Recipient address is required");
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
  });

  // ── estimateMaxSpendable ───────────────────────────────────────────

  describe("estimateMaxSpendable", () => {
    it("returns undefined for transparent transfers", () => {
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
  });
});
