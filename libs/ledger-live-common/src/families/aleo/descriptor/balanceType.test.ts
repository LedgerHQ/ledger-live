import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { createTransaction } from "@ledgerhq/coin-aleo/bridge/createTransaction";
import { TRANSACTION_TYPE } from "../constants";
import type { AleoAccount, AleoTokenAccount, AleoUnspentRecord, Transaction } from "../types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { aleoBalanceTypeConfig } from "./balanceType";

const RECORDS = { amountRecordCommitments: ["commitment"], feeRecordCommitment: "fee" };
const EMPTY_RECORDS = { amountRecordCommitments: [], feeRecordCommitment: null };

function records(...microcredits: number[]): AleoUnspentRecord[] {
  return microcredits.map(
    (value, index) =>
      ({ commitment: `commitment-${index}`, microcredits: String(value) }) as AleoUnspentRecord,
  );
}

function account({
  transparentBalance = 100,
  privateBalance = 40,
  unspentPrivateRecords = privateBalance === null ? [] : records(privateBalance),
}: {
  transparentBalance?: number;
  privateBalance?: number | null;
  unspentPrivateRecords?: AleoUnspentRecord[];
} = {}): AleoAccount {
  return {
    ...ALEO_ACCOUNT_1,
    freshAddress: "aleo1self",
    aleoResources: {
      transparentBalance: new BigNumber(transparentBalance),
      privateBalance: privateBalance === null ? null : new BigNumber(privateBalance),
      unspentPrivateRecords,
      provableApi: null,
      lastPrivateSyncDate: null,
    },
  };
}

function tokenAccount({
  privateBalance = 3,
  unspentPrivateRecords = privateBalance === null ? [] : records(privateBalance),
}: {
  privateBalance?: number | null;
  unspentPrivateRecords?: AleoUnspentRecord[];
} = {}): AleoTokenAccount {
  return {
    id: "aleo-token",
    type: "TokenAccount",
    parentId: ALEO_ACCOUNT_1.id,
    token: { parentCurrencyId: "aleo" },
    transparentBalance: new BigNumber(7),
    privateBalance: privateBalance === null ? null : new BigNumber(privateBalance),
    unspentPrivateRecords,
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
        "balanceType.transparent",
        "balanceType.shielded",
      ]);
      expect(options.map(option => option.icon)).toEqual(["check", "lock"]);
      expect(options.map(option => option.balance?.toNumber())).toEqual([100, 40]);
      expect(options.map(option => option.hasPendingBalance)).toEqual([false, false]);
      expect(options.map(option => option.hideSubtitle)).toEqual([true, true]);
    });

    it("offers the private balance as unknown with no pending banner before the first private sync", () => {
      const options = aleoBalanceTypeConfig.getOptions({
        account: account({ privateBalance: null }),
      });

      expect(options.map(option => option.id)).toEqual(["public", "private"]);
      expect(options[1].balance).toBeNull();
      expect(options[1].hasPendingBalance).toBe(false);
    });

    it("reads the balances of an Aleo token account", () => {
      const options = aleoBalanceTypeConfig.getOptions({ account: tokenAccount() });

      expect(options.map(option => option.id)).toEqual(["public", "private"]);
      expect(options.map(option => option.balance?.toNumber())).toEqual([7, 3]);
    });

    it("offers the private token balance as unknown before it is synced", () => {
      const options = aleoBalanceTypeConfig.getOptions({
        account: tokenAccount({ privateBalance: null }),
      });

      expect(options.map(option => option.balance?.toNumber())).toEqual([7, undefined]);
    });

    it("offers nothing for an Aleo account without resources", () => {
      const options = aleoBalanceTypeConfig.getOptions({
        account: { ...ALEO_ACCOUNT_1, aleoResources: undefined } as AleoAccount,
      });

      expect(options).toEqual([]);
    });

    it("offers nothing for a non-Aleo account", () => {
      const bitcoin = { type: "Account", currency: { family: "bitcoin" } } as AccountLike;

      expect(aleoBalanceTypeConfig.getOptions({ account: bitcoin })).toEqual([]);
    });

    it("offers nothing for a token account of another chain", () => {
      const erc20 = {
        ...tokenAccount(),
        token: { parentCurrencyId: "ethereum" },
      } as unknown as AccountLike;

      expect(aleoBalanceTypeConfig.getOptions({ account: erc20 })).toEqual([]);
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

    it("selects the public balance on a fresh transaction", () => {
      expect(aleoBalanceTypeConfig.getSelectedOptionId(createTransaction(account()))).toBe(
        "public",
      );
    });

    it("returns null for a non-Aleo transaction", () => {
      expect(aleoBalanceTypeConfig.getSelectedOptionId({ family: "zcash" })).toBeNull();
    });
  });

  describe("buildSelectionPatch", () => {
    it("draws from the private balance with empty records", () => {
      expect(aleoBalanceTypeConfig.buildSelectionPatch("private")).toEqual({
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: EMPTY_RECORDS,
      });
    });

    it("draws from the public balance without records", () => {
      expect(aleoBalanceTypeConfig.buildSelectionPatch("public")).toEqual({
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        properties: undefined,
      });
    });

    it("ignores an unknown option", () => {
      expect(aleoBalanceTypeConfig.buildSelectionPatch("staked")).toEqual({});
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

    it.each([
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC, "recipient.selfTransfer.toPrivate", false],
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, "recipient.selfTransfer.toPublic", true],
    ])(
      "targets the token's other balance at its parent's address from a %s spend",
      (mode, translationKey, isDestinationPublic) => {
        expect(
          aleoBalanceTypeConfig.getSelfTransferTarget({
            account: tokenAccount(),
            parentAccount: account(),
            transaction: transaction(mode, { subAccountId: "aleo-token" }),
          }),
        ).toEqual({ address: "aleo1self", translationKey, isDestinationPublic });
      },
    );

    it("has no target until the token's private balance is synced", () => {
      expect(
        aleoBalanceTypeConfig.getSelfTransferTarget({
          account: tokenAccount({ privateBalance: null }),
          parentAccount: account(),
          transaction: transaction(TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC),
        }),
      ).toBeNull();
    });

    it.each([
      ["without its parent", undefined],
      ["with another account as parent", { ...account(), id: "another-aleo-account" }],
    ])("has no target for a token account %s", (_, parentAccount) => {
      expect(
        aleoBalanceTypeConfig.getSelfTransferTarget({
          account: tokenAccount(),
          parentAccount,
          transaction: transaction(TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC),
        }),
      ).toBeNull();
    });
  });

  describe("buildSelfTransferPatch", () => {
    it.each([
      [TRANSACTION_TYPE.TRANSFER_PUBLIC, true, TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
      [TRANSACTION_TYPE.TRANSFER_PRIVATE, true, TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC],
      [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE, false, TRANSACTION_TYPE.TRANSFER_PUBLIC],
      [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC, false, TRANSACTION_TYPE.TRANSFER_PRIVATE],
    ])("turns %s with isSelfTransfer=%s into %s", (mode, isSelfTransfer, expected) => {
      expect(
        aleoBalanceTypeConfig.buildSelfTransferPatch({
          isSelfTransfer,
          transaction: transaction(mode),
        }),
      ).toEqual({ mode: expected });
    });

    it.each([
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC, TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE],
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC],
    ])("turns the token %s into %s", (mode, expected) => {
      expect(
        aleoBalanceTypeConfig.buildSelfTransferPatch({
          isSelfTransfer: true,
          transaction: transaction(mode, { subAccountId: "aleo-token" }),
        }),
      ).toEqual({ mode: expected });
    });

    it("leaves a transaction already in the requested state untouched", () => {
      expect(
        aleoBalanceTypeConfig.buildSelfTransferPatch({
          isSelfTransfer: false,
          transaction: transaction(TRANSACTION_TYPE.TRANSFER_PUBLIC),
        }),
      ).toEqual({});
    });

    it("leaves a non-Aleo transaction untouched", () => {
      expect(
        aleoBalanceTypeConfig.buildSelfTransferPatch({
          isSelfTransfer: true,
          transaction: { family: "zcash" },
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

    it.each([
      ["public", 7],
      ["private", 3],
    ])("returns the token %s balance", (optionId, expected) => {
      expect(
        aleoBalanceTypeConfig
          .getSelectableBalance({ account: tokenAccount(), optionId })
          .toNumber(),
      ).toBe(expected);
    });

    it("caps the private balance at the records one transaction can spend", () => {
      const fifteenRecords = records(...Array.from({ length: 15 }, (_, index) => index + 1));

      expect(
        aleoBalanceTypeConfig
          .getSelectableBalance({
            account: account({ privateBalance: 120, unspentPrivateRecords: fifteenRecords }),
            optionId: "private",
          })
          .toNumber(),
      ).toBe(119);
    });

    it("caps the token private balance at the records one token transaction can spend", () => {
      const fifteenRecords = records(...Array.from({ length: 15 }, (_, index) => index + 1));

      expect(
        aleoBalanceTypeConfig
          .getSelectableBalance({
            account: tokenAccount({ privateBalance: 120, unspentPrivateRecords: fifteenRecords }),
            optionId: "private",
          })
          .toNumber(),
      ).toBe(117);
    });
  });
});
