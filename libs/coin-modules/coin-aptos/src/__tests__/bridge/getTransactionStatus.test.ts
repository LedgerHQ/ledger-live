import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import getTransactionStatus from "../../bridge/getTransactionStatus";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";

describe("getTransactionStatus Test", () => {
  it("should return errors for AmountRequired", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new AmountRequired(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for FeeNotLoaded", async () => {
    const account = createFixtureAccount();
    account.balance = new BigNumber(10);

    const transaction = createFixtureTransaction();
    transaction.fees = null;
    transaction.amount = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        fees: new FeeNotLoaded(),
      },
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for NotEnoughBalance", async () => {
    const account = createFixtureAccount();
    account.balance = new BigNumber(1);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for RecipientRequired", async () => {
    const account = createFixtureAccount();
    account.balance = new BigNumber(10);

    const transaction = createFixtureTransaction();
    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new RecipientRequired(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for InvalidAddress", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x";

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new InvalidAddress(),
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for InvalidAddressBecauseDestinationIsAlsoSource", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);
    account.freshAddress = transaction.recipient;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });
});
