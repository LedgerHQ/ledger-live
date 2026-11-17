import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { StacksMemoTooLong } from "../errors";
import * as logicValidateMemo from "../logic/validateMemo";
import type { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../logic/validateMemo", () => {
  const actual = jest.requireActual("../logic/validateMemo");
  return { ...actual, validateMemo: jest.fn(actual.validateMemo) };
});

const ACCOUNT_ADDRESS = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const RECIPIENT = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";

const account = {
  currency: { name: "Stacks" },
  freshAddress: ACCOUNT_ADDRESS,
  freshAddressPath: "44'/5757'/0'/0/0",
  spendableBalance: new BigNumber(1_000),
} as Account;

const transaction = {
  amount: new BigNumber(100),
  recipient: RECIPIENT,
  fee: new BigNumber(10),
} as Transaction;

describe("getTransactionStatus", () => {
  const spiedValidateMemo = logicValidateMemo.validateMemo as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    spiedValidateMemo.mockReturnValue(true);
  });

  it("should return the calculated status for a valid native transfer", async () => {
    const status = await getTransactionStatus(account, transaction);

    expect(status).toMatchObject({
      errors: {},
      warnings: {},
      estimatedFees: transaction.fee,
      amount: transaction.amount,
      totalSpent: new BigNumber(110),
    });
  });

  it("should require a recipient", async () => {
    const status = await getTransactionStatus(account, { ...transaction, recipient: "" });

    expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should reject an invalid recipient", async () => {
    const status = await getTransactionStatus(account, {
      ...transaction,
      recipient: "not-an-address",
    });

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("should reject a transfer to the account address", async () => {
    const status = await getTransactionStatus(account, {
      ...transaction,
      recipient: ACCOUNT_ADDRESS,
    });

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should require a fee", async () => {
    const status = await getTransactionStatus(account, { ...transaction, fee: undefined });

    expect(status.errors.gas).toBeInstanceOf(FeeNotLoaded);
    expect(status.estimatedFees).toEqual(new BigNumber(0));
  });

  it("should require a positive amount", async () => {
    const status = await getTransactionStatus(account, {
      ...transaction,
      amount: new BigNumber(0),
    });

    expect(status.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should reject an amount and fee exceeding the spendable balance", async () => {
    const status = await getTransactionStatus(
      { ...account, spendableBalance: new BigNumber(100) },
      transaction,
    );

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should resolve useAllAmount to the spendable balance less the fee", async () => {
    const status = await getTransactionStatus(account, { ...transaction, useAllAmount: true });

    expect(status.amount).toEqual(new BigNumber(990));
    expect(status.totalSpent).toEqual(account.spendableBalance);
    expect(status.errors).toEqual({});
  });

  it("should reject useAllAmount when the fee consumes the spendable balance", async () => {
    const status = await getTransactionStatus(
      { ...account, spendableBalance: transaction.fee ?? new BigNumber(0) },
      { ...transaction, useAllAmount: true },
    );

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should use the token balance as the amount and reserve native balance for fees", async () => {
    const tokenAccount = {
      id: "token-account",
      type: "TokenAccount",
      spendableBalance: new BigNumber(500),
    } as TokenAccount;
    const status = await getTransactionStatus(
      { ...account, subAccounts: [tokenAccount] },
      { ...transaction, subAccountId: tokenAccount.id, useAllAmount: true },
    );

    expect(status.amount).toEqual(tokenAccount.spendableBalance);
    expect(status.totalSpent).toEqual(tokenAccount.spendableBalance);
    expect(status.errors).toEqual({});
  });

  it("should reject a token transfer when the native balance cannot pay its fee", async () => {
    const tokenAccount = {
      id: "token-account",
      type: "TokenAccount",
      spendableBalance: new BigNumber(500),
    } as TokenAccount;
    const status = await getTransactionStatus(
      { ...account, spendableBalance: new BigNumber(9), subAccounts: [tokenAccount] },
      { ...transaction, subAccountId: tokenAccount.id },
    );

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should not set an error when the transaction memo is valid", async () => {
    const memo = "random memo for unit test";
    const status = await getTransactionStatus(account, { ...transaction, memo });

    expect(status.errors.transaction).toBeUndefined();
    expect(spiedValidateMemo).toHaveBeenCalledWith(memo);
  });

  it("should set an error when the transaction memo is invalid", async () => {
    const memo = "random memo for unit test";
    spiedValidateMemo.mockReturnValueOnce(false);

    const status = await getTransactionStatus(account, { ...transaction, memo });

    expect(status.errors.transaction).toBeInstanceOf(StacksMemoTooLong);
    expect(spiedValidateMemo).toHaveBeenCalledWith(memo);
  });

  it.each(["delegate", "undelegate", undefined] as const)(
    "should require a recipient regardless of mode (%s)",
    async mode => {
      const status = await getTransactionStatus(account, {
        ...transaction,
        mode,
        recipient: "",
      });

      expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
    },
  );
});
