import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
} from "@ledgerhq/errors";
import * as logic from "../../logic";
import { IconAccount, Transaction } from "../../types";
import { getSendTransactionStatus, getTransactionStatus } from "../../getTransactionStatus";
import * as TransactionStatus from "../../getTransactionStatus";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { IconDoMaxSendInstead } from "../../errors";

jest.mock("../../logic");
jest.mock("../../api");
jest.mock("@ledgerhq/coin-framework/currencies/index");

const mockedLogic = jest.mocked(logic);
const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);

describe("getSendTransactionStatus", () => {
  let account: IconAccount;
  let transaction: Transaction;

  beforeEach(() => {
    account = {
      spendableBalance: new BigNumber(1000),
      currency: {
        name: "Icon",
        units: [
          {
            code: "ICX",
            name: "",
            magnitude: 0,
          },
        ],
      } as CryptoCurrency,
      iconResources: {
        totalDelegated: new BigNumber(0),
        votingPower: new BigNumber(0),
        nonce: 0,
      },
    } as IconAccount;
    transaction = {
      fees: new BigNumber(10),
      recipient: "test-recipient",
      useAllAmount: false,
    } as Transaction;
    mockedLogic.calculateAmount.mockReturnValue(new BigNumber(100));
    mockedLogic.getMinimumBalance.mockReturnValue(new BigNumber(50));
    mockedLogic.isSelfTransaction.mockReturnValue(false);
    mockedLogic.isValidAddress.mockReturnValue(true);
    mockedFormatCurrencyUnit.mockReturnValue("1 ICX");
  });

  it("should return FeeNotLoaded error if fees are not loaded", async () => {
    transaction.fees = null;
    const result = await getSendTransactionStatus(account, transaction);
    expect(result.errors.fees).toBeInstanceOf(FeeNotLoaded);
  });

  it("should return RecipientRequired error if recipient is missing", async () => {
    transaction.recipient = "";
    const result = await getSendTransactionStatus(account, transaction);
    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should return InvalidAddressBecauseDestinationIsAlsoSource error if recipient is the same as source", async () => {
    mockedLogic.isSelfTransaction.mockReturnValue(true);
    const result = await getSendTransactionStatus(account, transaction);
    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should return InvalidAddress error if recipient is invalid", async () => {
    mockedLogic.isValidAddress.mockReturnValue(false);
    const result = await getSendTransactionStatus(account, transaction);
    expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("should return AmountRequired error if amount is less than or equal to zero", async () => {
    mockedLogic.calculateAmount.mockReturnValue(new BigNumber(0));
    const result = await getSendTransactionStatus(account, transaction);
    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should return NotEnoughBalance error if total spent exceeds spendable balance", async () => {
    account.spendableBalance = new BigNumber(50);
    const result = await getSendTransactionStatus(account, transaction);
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should return proper TransactionStatus when everything is valid", async () => {
    const result = await getSendTransactionStatus(account, transaction);
    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.estimatedFees).toEqual(transaction.fees);
    expect(result.amount).toEqual(new BigNumber(100));
    expect(result.totalSpent).toEqual(new BigNumber(110));
  });

  it("should return IconDoMaxSendInstead error if leftover balance is less than minimumBalanceExistential but greater than zero", async () => {
    account.spendableBalance = new BigNumber(120);
    const result = await getSendTransactionStatus(account, transaction);
    expect(result.errors.amount).toBeInstanceOf(IconDoMaxSendInstead);
    expect(result.errors.amount.message).toBe(
      "Balance cannot be below {{minimumBalance}}. Send max to empty account.",
    );
  });
});

describe("getTransactionStatus", () => {
  let account: IconAccount;
  let transaction: Transaction;

  beforeEach(() => {
    account = {
      spendableBalance: new BigNumber(1000),
      currency: { name: "ICON", units: [{ code: "ICX" }] },
    } as IconAccount;
    transaction = {
      fees: new BigNumber(10),
      mode: "send",
      useAllAmount: false,
    } as Transaction;
    mockedLogic.calculateAmount.mockReturnValue(new BigNumber(100));
  });

  it("should delegate to getSendTransactionStatus for send mode", async () => {
    const sendTransactionStatus = {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(10),
      amount: new BigNumber(100),
      totalSpent: new BigNumber(110),
    } as any;
    jest
      .spyOn(TransactionStatus, "getSendTransactionStatus")
      .mockResolvedValue(sendTransactionStatus);
    const result = await getTransactionStatus(account, transaction);
    expect(result).toEqual(sendTransactionStatus);
  });

  it("should handle default case correctly", async () => {
    transaction.mode = "other";
    const result = await getTransactionStatus(account, transaction);
    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.estimatedFees).toEqual(transaction.fees);
    expect(result.amount).toEqual(new BigNumber(100));
    expect(result.totalSpent).toEqual(new BigNumber(110));
  });

  it("should return NotEnoughBalance error if totalSpent is greater than spendableBalance", async () => {
    transaction.mode = "";
    mockedLogic.calculateAmount.mockReturnValue(new BigNumber(1000));
    transaction.fees = new BigNumber(100);
    const result = await getTransactionStatus(account, transaction);
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should return AmountRequired error if amount is less than or equal to zero and useAllAmount is false", async () => {
    transaction.mode = "";
    mockedLogic.calculateAmount.mockReturnValue(new BigNumber(0));
    transaction.useAllAmount = false;
    const result = await getTransactionStatus(account, transaction);
    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });
});
