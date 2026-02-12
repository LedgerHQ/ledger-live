import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { validateAddress } from "../dfinity/validation";
import { InvalidMemoICP } from "../errors";
import * as logicValidateMemo from "../logic/validateMemo";
import type { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../dfinity/validation");
jest.mock("../logic/validateMemo");

describe("getTransactionStatus", () => {
  const spiedValidateMemo = jest.mocked(logicValidateMemo.validateMemo);
  const spiedValidateAddress = jest.mocked(validateAddress);

  const makeAccount = (overrides: Partial<Account> = {}): Account =>
    ({
      freshAddress: "sender-address",
      freshAddressPath: "44'/223'/0'/0/0",
      balance: new BigNumber(100000),
      spendableBalance: new BigNumber(100000),
      currency: { name: "Internet Computer" } as any,
      ...overrides,
    }) as any;

  const makeTx = (overrides: Partial<Transaction> = {}) =>
    ({
      family: "internet_computer",
      amount: new BigNumber(0),
      fees: new BigNumber(10000),
      recipient: "",
      memo: "",
      ...overrides,
    }) as Transaction;

  beforeEach(() => {
    spiedValidateMemo.mockClear();
    spiedValidateAddress.mockClear();
    spiedValidateAddress.mockReturnValue({ isValid: true } as any);
    spiedValidateMemo.mockReturnValue(true);
  });

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockReturnValueOnce(true);
    const account = makeAccount();
    const transaction = makeTx({ amount: BigNumber(0), memo: "random memo" });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeDefined();
    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockReturnValueOnce(false);
    const account = makeAccount();
    const transaction = makeTx({ amount: BigNumber(0), memo: "bad memo" });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(InvalidMemoICP);
  });

  it("should set RecipientRequired when recipient is empty", async () => {
    const account = makeAccount();
    const transaction = makeTx({
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "",
    });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should set InvalidAddress when recipient address is invalid", async () => {
    spiedValidateAddress.mockImplementation((addr: string) => {
      if (addr === "invalid-addr") return { isValid: false };
      return { isValid: true };
    });
    const account = makeAccount();
    const transaction = makeTx({
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "invalid-addr",
    });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("should set error when recipient is same as sender", async () => {
    const account = makeAccount({ freshAddress: "same-address" });
    const transaction = makeTx({
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "same-address",
    });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should set error on sender when sender address is invalid", async () => {
    spiedValidateAddress.mockImplementation((addr: string) => {
      if (addr === "invalid-sender") return { isValid: false };
      return { isValid: true };
    });
    const account = makeAccount({ freshAddress: "invalid-sender" });
    const transaction = makeTx({
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "valid-recipient",
    });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.sender).toBeInstanceOf(InvalidAddress);
  });

  it("should set NotEnoughBalance when useAllAmount and insufficient funds", async () => {
    const account = makeAccount({
      balance: new BigNumber(5000),
      spendableBalance: new BigNumber(5000),
    });
    const transaction = makeTx({
      amount: BigNumber(0),
      fees: BigNumber(10000),
      recipient: "recipient",
      useAllAmount: true,
    });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should compute correct amount for useAllAmount", async () => {
    const account = makeAccount({
      balance: new BigNumber(100000),
      spendableBalance: new BigNumber(100000),
    });
    const transaction = makeTx({
      amount: BigNumber(0),
      fees: BigNumber(10000),
      recipient: "recipient",
      useAllAmount: true,
    });
    const status = await getTransactionStatus(account, transaction);
    expect(status.amount).toEqual(new BigNumber(90000));
    expect(status.totalSpent).toEqual(new BigNumber(100000));
    expect(status.errors.amount).toBeUndefined();
  });

  it("should set AmountRequired when amount is 0 and not useAllAmount", async () => {
    const account = makeAccount();
    const transaction = makeTx({
      amount: BigNumber(0),
      fees: BigNumber(10000),
      recipient: "recipient",
      useAllAmount: false,
    });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should set NotEnoughBalance when totalSpent exceeds spendable", async () => {
    const account = makeAccount({ spendableBalance: new BigNumber(50000) });
    const transaction = makeTx({
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "recipient",
      useAllAmount: false,
    });
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should return no errors for a valid transaction", async () => {
    const account = makeAccount();
    const transaction = makeTx({
      amount: BigNumber(50000),
      fees: BigNumber(10000),
      recipient: "valid-recipient",
      useAllAmount: false,
    });
    const status = await getTransactionStatus(account, transaction);
    expect(Object.keys(status.errors)).toHaveLength(0);
    expect(status.estimatedFees).toEqual(new BigNumber(10000));
    expect(status.totalSpent).toEqual(new BigNumber(60000));
  });
});
