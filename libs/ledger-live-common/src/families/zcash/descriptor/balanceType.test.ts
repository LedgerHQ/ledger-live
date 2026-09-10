import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import { zcashBalanceTypeConfig } from "./balanceType";

const REFERENCE_HEIGHT = 3_450_000;
/** Deeper than ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS, so the note is spendable. */
const MATURE_HEIGHT = REFERENCE_HEIGHT - 100;

const ironwoodNote = (amount: number, index: number) => ({
  amount: new BigNumber(amount),
  transfer_type: "incoming",
  memo: "",
  nullifier: index.toString(16).padStart(2, "0").repeat(32),
  rho: "ee".repeat(32),
  rseed: "ff".repeat(32),
  cmx: "11".repeat(32),
  position: String(index),
  recipient: "22".repeat(43),
  isSpent: false,
});

function account({
  utxoValues = [],
  notes = [],
  shieldedAddress = "u1shielded",
  freshAddress = "t1transparent",
}: {
  utxoValues?: number[];
  notes?: { amount: number; blockHeight: number }[];
  shieldedAddress?: string | null;
  freshAddress?: string;
} = {}): ZcashAccount {
  return {
    id: "js:2:zcash:xpub:",
    type: "Account",
    freshAddress,
    blockHeight: REFERENCE_HEIGHT,
    pendingOperations: [],
    bitcoinResources: { utxos: utxoValues.map(value => ({ value: new BigNumber(value) })) },
    privateInfo: {
      lastProcessedBlock: REFERENCE_HEIGHT,
      shieldedAddress,
      transactions: notes.map((note, index) => ({
        id: `tx-${index}`,
        blockHeight: note.blockHeight,
        decryptedData: {
          orchard_outputs: [],
          sapling_outputs: [],
          ironwood_outputs: [ironwoodNote(note.amount, index)],
        },
      })),
    },
  } as unknown as ZcashAccount;
}

const transaction = (sender?: "public" | "private") => ({ family: "zcash", sender });

describe("zcash balance-type config", () => {
  describe("getOptions", () => {
    it("offers the transparent and the shielded pool, in that order", () => {
      const options = zcashBalanceTypeConfig.getOptions({ account: account() });

      expect(options.map(option => option.id)).toEqual(["public", "private"]);
      expect(options.map(option => option.translationKey)).toEqual([
        "balanceType.transparent",
        "balanceType.shielded",
      ]);
      expect(options.map(option => option.icon)).toEqual(["check", "lock"]);
    });

    it("sums the account's transparent UTXOs", () => {
      const [transparent] = zcashBalanceTypeConfig.getOptions({
        account: account({ utxoValues: [1000, 250] }),
      });

      expect(transparent.balance).toEqual(new BigNumber(1250));
      expect(transparent.hasPendingBalance).toBe(false);
    });

    it("reports the spendable shielded pool, not the total", () => {
      const [, shielded] = zcashBalanceTypeConfig.getOptions({
        account: account({
          notes: [
            { amount: 700, blockHeight: MATURE_HEIGHT },
            // Mined at the reference height, so still maturing: owned but unspendable.
            { amount: 300, blockHeight: REFERENCE_HEIGHT },
          ],
        }),
      });

      expect(shielded.balance).toEqual(new BigNumber(700));
      expect(shielded.hasPendingBalance).toBe(true);
    });

    it("reports no pending balance once every note is mature", () => {
      const [, shielded] = zcashBalanceTypeConfig.getOptions({
        account: account({ notes: [{ amount: 700, blockHeight: MATURE_HEIGHT }] }),
      });

      expect(shielded.balance).toEqual(new BigNumber(700));
      expect(shielded.hasPendingBalance).toBe(false);
    });

    it("offers no pool for an account holding no transparent resources", () => {
      const tokenAccount = { type: "TokenAccount", id: "token" } as unknown as AccountLike;

      expect(zcashBalanceTypeConfig.getOptions({ account: tokenAccount })).toEqual([]);
    });
  });

  describe("getSelectedOptionId", () => {
    it.each([
      ["public", "public"],
      ["private", "private"],
    ] as const)("reads `%s` off the transaction", (sender, expected) => {
      expect(zcashBalanceTypeConfig.getSelectedOptionId(transaction(sender))).toBe(expected);
    });

    it("reports no selection until the user picks a pool", () => {
      expect(zcashBalanceTypeConfig.getSelectedOptionId(transaction())).toBeNull();
      expect(zcashBalanceTypeConfig.getSelectedOptionId({ family: "bitcoin" })).toBeNull();
    });
  });

  describe("buildSelectionPatch", () => {
    it.each(["public", "private"])("makes the spend draw from the %s pool", optionId => {
      expect(zcashBalanceTypeConfig.buildSelectionPatch(optionId)).toEqual({ sender: optionId });
    });

    it("ignores an id it does not own rather than writing it to the transaction", () => {
      expect(zcashBalanceTypeConfig.buildSelectionPatch("staking")).toEqual({});
    });
  });

  describe("getSelfTransferTarget", () => {
    it("shields to the account's shielded address when spending transparent funds", () => {
      const target = zcashBalanceTypeConfig.getSelfTransferTarget({
        account: account(),
        transaction: transaction("public"),
      });

      expect(target).toEqual({
        address: "u1shielded",
        translationKey: "recipient.selfTransfer.toPrivate",
        isDestinationPublic: false,
      });
    });

    it("unshields to the account's transparent address when spending private funds", () => {
      const target = zcashBalanceTypeConfig.getSelfTransferTarget({
        account: account(),
        transaction: transaction("private"),
      });

      expect(target).toEqual({
        address: "t1transparent",
        translationKey: "recipient.selfTransfer.toPublic",
        isDestinationPublic: true,
      });
    });

    it("shields by default, since a spend draws from the transparent pool until a pool is picked", () => {
      const target = zcashBalanceTypeConfig.getSelfTransferTarget({
        account: account(),
        transaction: transaction(),
      });

      expect(target?.isDestinationPublic).toBe(false);
    });

    it("offers nothing while the shielded address is unknown", () => {
      const target = zcashBalanceTypeConfig.getSelfTransferTarget({
        account: account({ shieldedAddress: null }),
        transaction: transaction("public"),
      });

      expect(target).toBeNull();
    });
  });
});
