import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { TRANSACTION_TYPE } from "../constants";
import type { AleoAccount, AleoTokenAccount, Transaction } from "../types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { aleoBalanceTypeConfig } from "./balanceType";

const RECORDS = { amountRecordCommitments: ["commitment"], feeRecordCommitment: "fee" };
const EMPTY_RECORDS = { amountRecordCommitments: [], feeRecordCommitment: null };

function account({
  transparentBalance = 100,
  privateBalance = 40,
}: { transparentBalance?: number; privateBalance?: number | null } = {}): AleoAccount {
  return {
    ...ALEO_ACCOUNT_1,
    freshAddress: "aleo1self",
    aleoResources: {
      transparentBalance: new BigNumber(transparentBalance),
      privateBalance: privateBalance === null ? null : new BigNumber(privateBalance),
      unspentPrivateRecords: [],
      provableApi: null,
      lastPrivateSyncDate: null,
    },
  };
}

function tokenAccount(): AleoTokenAccount {
  return {
    id: "aleo-token",
    type: "TokenAccount",
    transparentBalance: new BigNumber(7),
    privateBalance: new BigNumber(3),
    unspentPrivateRecords: [],
  } as unknown as AleoTokenAccount;
}

function transaction(mode: Transaction["mode"], overrides: Partial<Transaction> = {}): Transaction {
  const privateModes: Transaction["mode"][] = [
    TRANSACTION_TYPE.TRANSFER_PRIVATE,
    TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
    TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
  ];
  return {
    family: "aleo",
    amount: new BigNumber(0),
    recipient: "",
    fees: new BigNumber(0),
    mode,
    ...(privateModes.includes(mode) && { properties: RECORDS }),
    ...overrides,
  } as Transaction;
}

describe("aleo balance-type config", () => {
  describe("getOptions", () => {
    it("offers the public and the private balance, in that order", () => {
      const options = aleoBalanceTypeConfig.getOptions({ account: account() });

      expect(options.map(option => option.id)).toEqual(["public", "private"]);
      expect(options.map(option => option.translationKey)).toEqual([
        "balanceType.aleoPublic",
        "balanceType.aleoPrivate",
      ]);
      expect(options.map(option => option.icon)).toEqual(["check", "lock"]);
      expect(options.map(option => option.balance.toNumber())).toEqual([100, 40]);
    });

    it("offers only the public balance until the private balance is synced", () => {
      const options = aleoBalanceTypeConfig.getOptions({
        account: account({ privateBalance: null }),
      });

      expect(options.map(option => option.id)).toEqual(["public"]);
    });

    it("reads the balances of an Aleo token account", () => {
      const options = aleoBalanceTypeConfig.getOptions({ account: tokenAccount() });

      expect(options.map(option => option.balance.toNumber())).toEqual([7, 3]);
    });

    it("offers nothing for a non-Aleo account", () => {
      const bitcoin = { type: "Account", currency: { family: "bitcoin" } } as AccountLike;

      expect(aleoBalanceTypeConfig.getOptions({ account: bitcoin })).toEqual([]);
    });
  });

  describe("getSelectedOptionId", () => {
    it.each([
      [TRANSACTION_TYPE.TRANSFER_PUBLIC, "public"],
      [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE, "public"],
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC, "public"],
      [TRANSACTION_TYPE.TRANSFER_PRIVATE, "private"],
      [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC, "private"],
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, "private"],
    ])("maps %s to the %s balance", (mode, expected) => {
      expect(aleoBalanceTypeConfig.getSelectedOptionId(transaction(mode))).toBe(expected);
    });

    it("returns null for a non-Aleo transaction", () => {
      expect(aleoBalanceTypeConfig.getSelectedOptionId({ family: "zcash" })).toBeNull();
    });
  });

  describe("buildSelectionPatch", () => {
    it("switches a public transfer to a private one with empty records", () => {
      const patch = aleoBalanceTypeConfig.buildSelectionPatch(
        "private",
        transaction(TRANSACTION_TYPE.TRANSFER_PUBLIC),
      );

      expect(patch).toEqual({
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: EMPTY_RECORDS,
      });
    });

    it("switches a private transfer to a public one and drops its records", () => {
      const patch = aleoBalanceTypeConfig.buildSelectionPatch(
        "public",
        transaction(TRANSACTION_TYPE.TRANSFER_PRIVATE),
      );

      expect(patch).toEqual({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC, properties: undefined });
    });

    it("derives the token mode for a token transaction", () => {
      const patch = aleoBalanceTypeConfig.buildSelectionPatch(
        "private",
        transaction(TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC, { subAccountId: "aleo-token" }),
      );

      expect(patch).toMatchObject({ mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE });
    });

    it("keeps a self-transfer when the same balance is picked again", () => {
      const patch = aleoBalanceTypeConfig.buildSelectionPatch(
        "public",
        transaction(TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE),
      );

      expect(patch).toMatchObject({ mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE });
    });

    it("drops a self-transfer when the other balance is picked", () => {
      const patch = aleoBalanceTypeConfig.buildSelectionPatch(
        "private",
        transaction(TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE),
      );

      expect(patch).toMatchObject({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE });
    });

    it("ignores an unknown option", () => {
      expect(
        aleoBalanceTypeConfig.buildSelectionPatch(
          "staked",
          transaction(TRANSACTION_TYPE.TRANSFER_PUBLIC),
        ),
      ).toEqual({});
    });
  });

  describe("getSelfTransferTarget", () => {
    it("targets the private balance at the account's own address from a public spend", () => {
      expect(
        aleoBalanceTypeConfig.getSelfTransferTarget({
          account: account(),
          transaction: transaction(TRANSACTION_TYPE.TRANSFER_PUBLIC),
        }),
      ).toEqual({
        address: "aleo1self",
        translationKey: "recipient.selfTransfer.toPrivate",
        isDestinationPublic: false,
      });
    });

    it("targets the public balance at the account's own address from a private spend", () => {
      expect(
        aleoBalanceTypeConfig.getSelfTransferTarget({
          account: account(),
          transaction: transaction(TRANSACTION_TYPE.TRANSFER_PRIVATE),
        }),
      ).toEqual({
        address: "aleo1self",
        translationKey: "recipient.selfTransfer.toPublic",
        isDestinationPublic: true,
      });
    });

    it("has no target until the private balance is synced", () => {
      expect(
        aleoBalanceTypeConfig.getSelfTransferTarget({
          account: account({ privateBalance: null }),
          transaction: transaction(TRANSACTION_TYPE.TRANSFER_PUBLIC),
        }),
      ).toBeNull();
    });

    it("has no target for a token account", () => {
      expect(
        aleoBalanceTypeConfig.getSelfTransferTarget({
          account: tokenAccount(),
          transaction: transaction(TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC),
        }),
      ).toBeNull();
    });
  });

  describe("buildSelfTransferPatch", () => {
    it.each([
      [TRANSACTION_TYPE.TRANSFER_PUBLIC, TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
      [TRANSACTION_TYPE.TRANSFER_PRIVATE, TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC],
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC, TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE],
    ])("turns %s into %s", (mode, expected) => {
      const patch = aleoBalanceTypeConfig.buildSelfTransferPatch({
        isSelfTransfer: true,
        transaction: transaction(mode, {
          ...(mode === TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC && { subAccountId: "aleo-token" }),
        }),
      });

      expect(patch).toMatchObject({ mode: expected });
    });

    it("keeps the selected records when converting a private balance", () => {
      const patch = aleoBalanceTypeConfig.buildSelfTransferPatch({
        isSelfTransfer: true,
        transaction: transaction(TRANSACTION_TYPE.TRANSFER_PRIVATE),
      });

      expect(patch).toEqual({
        mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
        properties: RECORDS,
      });
    });

    it("turns a conversion back into a transfer for any other recipient", () => {
      const patch = aleoBalanceTypeConfig.buildSelfTransferPatch({
        isSelfTransfer: false,
        transaction: transaction(TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC),
      });

      expect(patch).toMatchObject({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE });
    });

    it("leaves a transaction already in the requested state untouched", () => {
      expect(
        aleoBalanceTypeConfig.buildSelfTransferPatch({
          isSelfTransfer: false,
          transaction: transaction(TRANSACTION_TYPE.TRANSFER_PUBLIC),
        }),
      ).toEqual({});
    });
  });

  describe("getSelectableBalance", () => {
    it.each([
      ["public", 100],
      ["private", 40],
      ["staked", 0],
    ])("returns the %s balance", (optionId, expected) => {
      expect(
        aleoBalanceTypeConfig.getSelectableBalance({ account: account(), optionId }).toNumber(),
      ).toBe(expected);
    });

    it("returns zero for the private balance before it is synced", () => {
      expect(
        aleoBalanceTypeConfig
          .getSelectableBalance({ account: account({ privateBalance: null }), optionId: "private" })
          .toNumber(),
      ).toBe(0);
    });
  });
});
