import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import createTransaction from "./createTransaction";
import getTransactionStatus from "./getTransactionStatus";
import {
  AmountRequired,
  FeeNotLoaded,
  GasLessThanEstimate,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  SequenceNumberTooNewError,
  SequenceNumberTooOldError,
  TransactionExpiredError,
} from "./errors";

describe("getTransactionStatus Test", () => {
  it("should return errors for AmountRequired", async () => {
    const account = createFixtureAccount();
    const transaction = createTransaction();

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
    const transaction = createTransaction();

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
    const transaction = createTransaction();

    account.balance = new BigNumber(1);
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
    const transaction = createTransaction();

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
    const transaction = createTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x";

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new InvalidAddress(),
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
    const transaction = createTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);
    account.freshAddress = transaction.recipient;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for GasLessThanEstimate", async () => {
    const account = createFixtureAccount();
    const transaction = createTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);

    transaction.options.maxGasAmount = "50";
    transaction.estimate.maxGasAmount = "100";

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        maxGasAmount: new GasLessThanEstimate(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for GasLessThanEstimate", async () => {
    const account = createFixtureAccount();
    const transaction = createTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);

    transaction.options.gasUnitPrice = "50";
    transaction.estimate.gasUnitPrice = "100";

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        gasUnitPrice: new GasLessThanEstimate(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for SequenceNumberTooOldError", async () => {
    const account = createFixtureAccount();
    const transaction = createTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.errors = {
      sequenceNumber: "TOO_OLD",
    };

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        sequenceNumber: new SequenceNumberTooOldError(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for SequenceNumberTooNewError", async () => {
    const account = createFixtureAccount();
    const transaction = createTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.errors = {
      sequenceNumber: "TOO_NEW",
    };

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        sequenceNumber: new SequenceNumberTooNewError(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return errors for TransactionExpiredError", async () => {
    const account = createFixtureAccount();
    const transaction = createTransaction();

    transaction.amount = new BigNumber(2);
    transaction.fees = new BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.errors = {
      expirationTimestampSecs: "expirationTimestampSecs",
    };

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        expirationTimestampSecs: new TransactionExpiredError(),
      },
      warnings: {},
      estimatedFees: new BigNumber(2),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(4),
    };

    expect(result).toEqual(expected);
  });
});
