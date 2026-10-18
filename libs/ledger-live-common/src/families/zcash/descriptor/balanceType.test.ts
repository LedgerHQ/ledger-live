import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import { zcashBalanceTypeConfig, zcashRecipientAccount } from "./balanceType";

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
  withBitcoinResources = true,
  ufvk = "uview1test",
  currencyId = "zcash",
}: {
  utxoValues?: number[];
  notes?: { amount: number; blockHeight: number }[];
  shieldedAddress?: string | null;
  freshAddress?: string;
  withBitcoinResources?: boolean;
  ufvk?: string | null;
  currencyId?: string;
} = {}): ZcashAccount {
  return {
    id: "js:2:zcash:xpub:",
    type: "Account",
    currency: { id: currencyId },
    freshAddress,
    blockHeight: REFERENCE_HEIGHT,
    pendingOperations: [],
    bitcoinResources: withBitcoinResources
      ? { utxos: utxoValues.map(value => ({ value: new BigNumber(value) })) }
      : undefined,
    privateInfo: {
      lastProcessedBlock: REFERENCE_HEIGHT,
      shieldedAddress,
      ufvk,
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

    it("offers both pools on a zcash testnet account", () => {
      const options = zcashBalanceTypeConfig.getOptions({
        account: account({ currencyId: "zcash_testnet" }),
      });

      expect(options.map(option => option.id)).toEqual(["public", "private"]);
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

    it("offers no pool for a token account", () => {
      const tokenAccount = { type: "TokenAccount", id: "token" } as unknown as AccountLike;

      expect(zcashBalanceTypeConfig.getOptions({ account: tokenAccount })).toEqual([]);
    });

    it("still offers both pools when transparent resources are not attached yet", () => {
      const options = zcashBalanceTypeConfig.getOptions({
        account: account({
          withBitcoinResources: false,
          notes: [{ amount: 700, blockHeight: MATURE_HEIGHT }],
        }),
      });

      expect(options.map(option => option.id)).toEqual(["public", "private"]);
      expect(options[0].balance).toEqual(new BigNumber(0));
      expect(options[1].balance).toEqual(new BigNumber(700));
    });

    it("offers only the transparent pool when the shielded viewing key is missing", () => {
      const options = zcashBalanceTypeConfig.getOptions({
        account: account({
          ufvk: null,
          notes: [{ amount: 700, blockHeight: MATURE_HEIGHT }],
        }),
      });

      expect(options.map(option => option.id)).toEqual(["public"]);
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

  describe("getSelectableBalance", () => {
    it("returns the full transparent balance when there are ≤32 UTXOs", () => {
      const acc = account({ utxoValues: [1000, 250, 500] });

      expect(
        zcashBalanceTypeConfig.getSelectableBalance({ account: acc, optionId: "public" }),
      ).toEqual(new BigNumber(1750));
    });

    it("returns the transparent balance of a zcash testnet account", () => {
      const acc = account({ utxoValues: [1000, 250, 500], currencyId: "zcash_testnet" });

      expect(
        zcashBalanceTypeConfig.getSelectableBalance({ account: acc, optionId: "public" }),
      ).toEqual(new BigNumber(1750));
    });

    it("caps the transparent balance to the 32 largest UTXOs when there are more", () => {
      // 33 UTXOs of 100 each — only 32 can be included in one transaction.
      const utxoValues = Array.from({ length: 33 }, () => 100);
      const acc = account({ utxoValues });

      const selectable = zcashBalanceTypeConfig.getSelectableBalance({
        account: acc,
        optionId: "public",
      });
      const displayBalance = zcashBalanceTypeConfig.getOptions({ account: acc })[0].balance;

      expect(selectable).toEqual(new BigNumber(3200)); // 32 × 100
      expect(displayBalance).toEqual(new BigNumber(3300)); // 33 × 100
    });

    it("returns the full shielded balance when there are ≤32 notes", () => {
      const acc = account({
        notes: [
          { amount: 400, blockHeight: MATURE_HEIGHT },
          { amount: 300, blockHeight: MATURE_HEIGHT },
        ],
      });

      expect(
        zcashBalanceTypeConfig.getSelectableBalance({ account: acc, optionId: "private" }),
      ).toEqual(new BigNumber(700));
    });

    it("caps the shielded balance to the 32 largest notes when there are more", () => {
      // 33 mature notes of 100 each — only 32 can be included in one transaction.
      const notes = Array.from({ length: 33 }, () => ({ amount: 100, blockHeight: MATURE_HEIGHT }));
      const acc = account({ notes });

      const selectable = zcashBalanceTypeConfig.getSelectableBalance({
        account: acc,
        optionId: "private",
      });
      const displayBalance = zcashBalanceTypeConfig.getOptions({ account: acc })[1].balance;

      expect(selectable).toEqual(new BigNumber(3200)); // 32 × 100
      expect(displayBalance).toEqual(new BigNumber(3300)); // 33 × 100
    });

    it("returns zero for an unknown option id", () => {
      const acc = account({ utxoValues: [1000] });

      expect(
        zcashBalanceTypeConfig.getSelectableBalance({ account: acc, optionId: "staking" }),
      ).toEqual(new BigNumber(0));
    });

    it("returns zero for a non-Zcash account", () => {
      const tokenAccount = { type: "TokenAccount", id: "token" } as unknown as AccountLike;

      expect(
        zcashBalanceTypeConfig.getSelectableBalance({ account: tokenAccount, optionId: "public" }),
      ).toEqual(new BigNumber(0));
    });

    it("returns zero while transparent resources are not attached yet", () => {
      const acc = account({ withBitcoinResources: false });

      expect(
        zcashBalanceTypeConfig.getSelectableBalance({ account: acc, optionId: "public" }),
      ).toEqual(new BigNumber(0));
    });

    it("returns zero for the private pool when the shielded viewing key is missing", () => {
      const acc = account({
        ufvk: null,
        notes: [{ amount: 700, blockHeight: MATURE_HEIGHT }],
      });

      expect(
        zcashBalanceTypeConfig.getSelectableBalance({ account: acc, optionId: "private" }),
      ).toEqual(new BigNumber(0));
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

    it("offers nothing when the shielded viewing key is missing", () => {
      const target = zcashBalanceTypeConfig.getSelfTransferTarget({
        account: account({ ufvk: null }),
        transaction: transaction("public"),
      });

      expect(target).toBeNull();
    });
  });

  describe("buildSelfTransferPatch", () => {
    it.each([true, false])(
      "records a self-transfer of %s, which the bridge never infers from the recipient",
      isSelfTransfer => {
        expect(
          zcashBalanceTypeConfig.buildSelfTransferPatch({
            isSelfTransfer,
            transaction: transaction("public"),
          }),
        ).toEqual({ selfTransfer: isSelfTransfer });
      },
    );
  });
});

describe("zcash recipient account patch", () => {
  const SIBLING_ADDRESS = "u1sibling";
  const CLEARED = { recipientAccountIndex: undefined };

  function seedAccount({
    id,
    index,
    shieldedAddress,
    seedIdentifier = "seed-a",
    currencyId = "zcash",
    type = "Account",
  }: {
    id: string;
    index: number;
    shieldedAddress: string | null;
    seedIdentifier?: string;
    currencyId?: string;
    type?: string;
  }): AccountLike {
    return {
      id,
      type,
      seedIdentifier,
      currency: { id: currencyId },
      bitcoinResources: { utxos: [], walletAccount: { params: { index } } },
      privateInfo: { shieldedAddress },
    } as unknown as AccountLike;
  }

  const sender = seedAccount({ id: "sender", index: 0, shieldedAddress: "u1sender" });
  const sibling = seedAccount({ id: "sibling", index: 3, shieldedAddress: SIBLING_ADDRESS });
  const buildPatch = (recipient: string | undefined, accounts: AccountLike[], from = sender) =>
    zcashRecipientAccount.buildPatch({ account: from, recipient, accounts, transaction: {} });

  it("records the index of another account of the same seed holding the recipient", () => {
    expect(buildPatch(SIBLING_ADDRESS, [sender, sibling])).toEqual({ recipientAccountIndex: 3 });
  });

  it("matches the recipient as typed, after trimming", () => {
    expect(buildPatch(`  ${SIBLING_ADDRESS} `, [sender, sibling])).toEqual({
      recipientAccountIndex: 3,
    });
  });

  it("accepts the index bounds 0 and 100", () => {
    const first = seedAccount({ id: "first", index: 0, shieldedAddress: "u1first" });
    const last = seedAccount({ id: "last", index: 100, shieldedAddress: "u1last" });

    expect(buildPatch("u1first", [sender, first])).toEqual({ recipientAccountIndex: 0 });
    expect(buildPatch("u1last", [sender, last])).toEqual({ recipientAccountIndex: 100 });
  });

  it.each([
    ["the sending account's own address", "u1sender", [sender, sibling]],
    ["an unknown address", "u1unknown", [sender, sibling]],
    ["a transparent address", "t1sibling", [sender, sibling]],
    ["an empty recipient", "", [sender, sibling]],
    ["an account list without the sibling", SIBLING_ADDRESS, [sender]],
  ])("clears the index for %s", (_label, recipient, accounts) => {
    expect(buildPatch(recipient, accounts)).toEqual(CLEARED);
  });

  it("clears the index for an undefined recipient", () => {
    expect(buildPatch(undefined, [sender, sibling])).toEqual(CLEARED);
  });

  it("clears the index for an account of another seed", () => {
    const other = seedAccount({
      id: "other",
      index: 1,
      shieldedAddress: SIBLING_ADDRESS,
      seedIdentifier: "seed-b",
    });

    expect(buildPatch(SIBLING_ADDRESS, [sender, other])).toEqual(CLEARED);
  });

  it("clears the index for an account of another network", () => {
    const testnet = seedAccount({
      id: "testnet",
      index: 1,
      shieldedAddress: SIBLING_ADDRESS,
      currencyId: "zcash_testnet",
    });

    expect(buildPatch(SIBLING_ADDRESS, [sender, testnet])).toEqual(CLEARED);
  });

  it.each([101, -1, 1.5])("clears the index when the account index is %s", index => {
    const far = seedAccount({ id: "far", index, shieldedAddress: SIBLING_ADDRESS });

    expect(buildPatch(SIBLING_ADDRESS, [sender, far])).toEqual(CLEARED);
  });

  it("clears the index when the destination wallet account cannot be read", () => {
    const broken = {
      ...(sibling as object),
      bitcoinResources: { utxos: [] },
    } as unknown as AccountLike;

    expect(buildPatch(SIBLING_ADDRESS, [sender, broken])).toEqual(CLEARED);
  });

  it("clears the index when the sending account is not a Zcash main account", () => {
    const tokenAccount = seedAccount({
      id: "tok",
      index: 0,
      shieldedAddress: null,
      type: "TokenAccount",
    });

    expect(buildPatch(SIBLING_ADDRESS, [sibling], tokenAccount)).toEqual(CLEARED);
  });
});
