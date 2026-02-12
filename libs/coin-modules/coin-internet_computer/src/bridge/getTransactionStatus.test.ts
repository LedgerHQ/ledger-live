import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { validateAddress } from "../dfinity/validation";
import { InvalidMemoICP } from "../errors";
import * as logicValidateMemo from "../logic/validateMemo";
import { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../dfinity/validation");
jest.mock("../logic/validateMemo");

describe("getTransactionStatus", () => {
  const spiedValidateMemo = logicValidateMemo.validateMemo as jest.Mock;
  const spiedValidateAddress = jest.mocked(validateAddress);

  const makeAccount = (overrides: Partial<Account> = {}) =>
    ({
      freshAddress: "sender-address",
      freshAddressPath: "44'/223'/0'/0/0",
      balance: new BigNumber(100000),
      spendableBalance: new BigNumber(100000),
      currency: { name: "Internet Computer" },
      ...overrides,
    }) as Account;

  beforeEach(() => {
    spiedValidateMemo.mockClear();
    spiedValidateAddress.mockClear();
    spiedValidateAddress.mockResolvedValue({ isValid: true } as never);
    spiedValidateMemo.mockReturnValue(true);
  });

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockReturnValueOnce(true);
    const account = makeAccount();
    const transaction = { amount: BigNumber(0), memo: "random memo" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeDefined();
    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockReturnValueOnce(false);
    const account = makeAccount();
    const transaction = { amount: BigNumber(0), memo: "bad memo" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(InvalidMemoICP);
  });

  it("should set RecipientRequired when recipient is empty", async () => {
    const account = makeAccount();
    const transaction = {
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should set InvalidAddress when recipient address is invalid", async () => {
    spiedValidateAddress.mockImplementation(async (addr: string) => {
      if (addr === "invalid-addr") return { isValid: false } as any;
      return { isValid: true } as any;
    });
    const account = makeAccount();
    const transaction = {
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "invalid-addr",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("should set error when recipient is same as sender", async () => {
    const account = makeAccount({ freshAddress: "same-address" });
    const transaction = {
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "same-address",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should set error on sender when sender address is invalid", async () => {
    spiedValidateAddress.mockImplementation(async (addr: string) => {
      if (addr === "invalid-sender") return { isValid: false } as any;
      return { isValid: true } as any;
    });
    const account = makeAccount({ freshAddress: "invalid-sender" });
    const transaction = {
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "valid-recipient",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.sender).toBeInstanceOf(InvalidAddress);
  });

  it("should set NotEnoughBalance when useAllAmount and insufficient funds", async () => {
    const account = makeAccount({
      balance: new BigNumber(5000),
      spendableBalance: new BigNumber(5000),
    });
    const transaction = {
      amount: BigNumber(0),
      fees: BigNumber(10000),
      recipient: "recipient",
      useAllAmount: true,
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should compute correct amount for useAllAmount", async () => {
    const account = makeAccount({
      balance: new BigNumber(100000),
      spendableBalance: new BigNumber(100000),
    });
    const transaction = {
      amount: BigNumber(0),
      fees: BigNumber(10000),
      recipient: "recipient",
      useAllAmount: true,
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.amount).toEqual(new BigNumber(90000));
    expect(status.totalSpent).toEqual(new BigNumber(100000));
    expect(status.errors.amount).toBeUndefined();
  });

  it("should set AmountRequired when amount is 0 and not useAllAmount", async () => {
    const account = makeAccount();
    const transaction = {
      amount: BigNumber(0),
      fees: BigNumber(10000),
      recipient: "recipient",
      useAllAmount: false,
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should set NotEnoughBalance when totalSpent exceeds spendable", async () => {
    const account = makeAccount({ spendableBalance: new BigNumber(50000) });
    const transaction = {
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "recipient",
      useAllAmount: false,
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should return no errors for a valid transaction", async () => {
    const account = makeAccount();
    const transaction = {
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "valid-recipient",
      useAllAmount: false,
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(Object.keys(status.errors)).toHaveLength(0);
    expect(status.estimatedFees).toEqual(new BigNumber(10000));
    expect(status.totalSpent).toEqual(new BigNumber(60000));
  });
});
