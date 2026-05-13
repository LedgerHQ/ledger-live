import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE } from "../constants";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import {
  getMockedTransaction,
  getMockedTransactionRaw,
} from "../__tests__/fixtures/transaction.fixture";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";

describe("transaction", () => {
  const mockedAccount = getMockedAccount();
  const mockedTransaction = getMockedTransaction({
    amount: new BigNumber(10 ** 6), // 1 ALEO
    fees: new BigNumber(5000),
  });
  const mockedTransactionRaw = getMockedTransactionRaw({
    amount: mockedTransaction.amount.toString(),
    fees: mockedTransaction.fees.toString(),
  });
  const fullPrivateProperties = {
    amountRecordCommitments: ["abc123"],
    feeRecordCommitment: "def456",
  };
  const emptyPrivateProperties = {
    amountRecordCommitments: [],
    feeRecordCommitment: null,
  };

  it("should format transaction as a human-readable send summary", () => {
    const result = formatTransaction(mockedTransaction, mockedAccount);
    const nonBreakingSpace = String.fromCharCode(160);
    const string = `SEND 1${nonBreakingSpace}ALEO\nTO ${mockedTransaction.recipient}`;

    expect(result).toEqual(string);
  });

  it("should deserialize a raw transaction into a Transaction", () => {
    const result = fromTransactionRaw(mockedTransactionRaw);

    expect(result).toEqual(mockedTransaction);
  });

  it("should serialize a Transaction into a raw transaction", () => {
    const result = toTransactionRaw(mockedTransaction);

    expect(result).toEqual(mockedTransactionRaw);
  });

  it.each([TRANSACTION_TYPE.TRANSFER_PRIVATE, TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC])(
    "should preserve properties when deserializing %s from raw",
    mode => {
      const raw = getMockedTransactionRaw({ mode, properties: fullPrivateProperties });
      const result = fromTransactionRaw(raw);

      expect(result.mode).toBe(mode);
      expect(result.properties).toEqual(fullPrivateProperties);
    },
  );

  it.each([TRANSACTION_TYPE.TRANSFER_PRIVATE, TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC])(
    "should preserve null commitments when deserializing %s from raw",
    mode => {
      const raw = getMockedTransactionRaw({ mode, properties: emptyPrivateProperties });
      const result = fromTransactionRaw(raw);

      expect(result.properties).toEqual(emptyPrivateProperties);
    },
  );

  it.each([TRANSACTION_TYPE.TRANSFER_PRIVATE, TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC])(
    "should preserve properties when serializing %s to raw",
    mode => {
      const transaction = getMockedTransaction({ mode, properties: fullPrivateProperties });
      const result = toTransactionRaw(transaction);

      expect(result.mode).toBe(mode);
      expect(result.properties).toEqual(fullPrivateProperties);
    },
  );

  it.each([TRANSACTION_TYPE.TRANSFER_PUBLIC, TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE])(
    "should not include properties when deserializing %s from raw",
    mode => {
      const raw = getMockedTransactionRaw({ mode });
      const result = fromTransactionRaw(raw);

      expect("properties" in result).toBe(false);
    },
  );

  it.each([TRANSACTION_TYPE.TRANSFER_PUBLIC, TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE])(
    "should not include properties when serializing %s to raw",
    mode => {
      const transaction = getMockedTransaction({ mode });
      const result = toTransactionRaw(transaction);

      expect("properties" in result).toBe(false);
    },
  );
});
