import BigNumber from "bignumber.js";
import {
  createFixtureAccount,
  createFixtureAccountWithSubAccount,
  createFixtureTransaction,
  createFixtureTransactionWithSubAccount,
} from "../../bridge/bridge.fixture";
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
  it("should return error for AmountRequired", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.fees = BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new AmountRequired(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(0),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for FeeNotLoaded", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(10);

    const transaction = createFixtureTransaction();
    transaction.fees = null;
    transaction.amount = BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        fees: new FeeNotLoaded(),
      },
      warnings: {},
      estimatedFees: BigNumber(0),
      amount: BigNumber(2),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(1);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance and amount equal to zero with use all amount option", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(1);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.useAllAmount = true;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(0),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance for token account", async () => {
    const account = createFixtureAccountWithSubAccount("coin");
    account.spendableBalance = BigNumber(1);

    const transaction = createFixtureTransactionWithSubAccount();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2000);
    transaction.fees = BigNumber(200);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(200),
      amount: BigNumber(2000),
      totalSpent: BigNumber(2200),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance with use all amount option", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(1);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.useAllAmount = true;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(0),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance for token account with use all amount option", async () => {
    const account = createFixtureAccountWithSubAccount("coin");
    account.spendableBalance = BigNumber(10);

    const transaction = createFixtureTransactionWithSubAccount();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2000);
    transaction.fees = BigNumber(200);
    transaction.useAllAmount = true;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(200),
      amount: BigNumber(1000),
      totalSpent: BigNumber(1200),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for RecipientRequired", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(10);

    const transaction = createFixtureTransaction();
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.recipient = "";

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new RecipientRequired(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for InvalidAddress", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.recipient = "0x";

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new InvalidAddress(),
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for InvalidAddressBecauseDestinationIsAlsoSource", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);
    account.freshAddress = transaction.recipient;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for RecipientRequired", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.recipient = "";
    account.freshAddress = transaction.recipient;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new RecipientRequired(),
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return right amount and total spent with use all amount option", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(10);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.useAllAmount = true;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {},
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(8),
      totalSpent: BigNumber(10),
    };

    expect(result).toEqual(expected);
  });
});
