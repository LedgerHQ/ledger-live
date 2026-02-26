import BigNumber from "bignumber.js";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import {
  getMockedTransaction,
  getMockedTransactionRaw,
} from "../__tests__/fixtures/transaction.fixture";
import { TRANSACTION_TYPE } from "../constants";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";

describe("transaction", () => {
  const mockedAccount = getMockedAccount();

  describe("formatTransaction", () => {
    it("should format transaction with recipient and amount", () => {
      const mockedTransaction = getMockedTransaction({
        amount: new BigNumber(10 ** 6), // 1 ALEO
        fees: new BigNumber(5000),
      });
      const result = formatTransaction(mockedTransaction, mockedAccount);
      const nonBreakingSpace = String.fromCharCode(160);
      const expected = `SEND 1${nonBreakingSpace}ALEO\nTO ${mockedTransaction.recipient}`;

      expect(result).toEqual(expected);
    });
  });

  describe("fromTransactionRaw", () => {
    it("should convert raw transaction to transaction for standard transfer", () => {
      const mockedTransactionRaw = getMockedTransactionRaw({
        type: TRANSACTION_TYPE.TRANSFER,
        amount: "1000000",
        fees: "5000",
      });

      const result = fromTransactionRaw(mockedTransactionRaw);

      expect(result.family).toEqual(mockedTransactionRaw.family);
      expect(result.type).toEqual(TRANSACTION_TYPE.TRANSFER);
      expect(result.fees).toEqual(new BigNumber("5000"));
      expect(result.amountRecord).toBeUndefined();
      expect(result.feeRecord).toBeUndefined();
    });

    it("should convert raw transaction with amountRecord and feeRecord for private transfer", () => {
      const mockedTransactionRaw = getMockedTransactionRaw({
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        amount: "1000000",
        fees: "5000",
        amountRecord: "record_1",
        feeRecord: "record_2",
      });

      const result = fromTransactionRaw(mockedTransactionRaw);

      expect(result.family).toEqual(mockedTransactionRaw.family);
      expect(result.type).toEqual(TRANSACTION_TYPE.TRANSFER_PRIVATE);
      expect(result.fees).toEqual(new BigNumber("5000"));
      expect(result.amountRecord).toEqual("record_1");
      expect(result.feeRecord).toEqual("record_2");
    });

    it("should convert raw transaction with amountRecord and feeRecord for convert private to public", () => {
      const mockedTransactionRaw = getMockedTransactionRaw({
        type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
        amount: "1000000",
        fees: "5000",
        amountRecord: "record_3",
        feeRecord: "record_4",
      });

      const result = fromTransactionRaw(mockedTransactionRaw);

      expect(result.type).toEqual(TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC);
      expect(result.amountRecord).toEqual("record_3");
      expect(result.feeRecord).toEqual("record_4");
    });
  });

  describe("toTransactionRaw", () => {
    it("should convert transaction to raw for standard transfer", () => {
      const mockedTransaction = getMockedTransaction({
        type: TRANSACTION_TYPE.TRANSFER,
        amount: new BigNumber(1000000),
        fees: new BigNumber(5000),
      });

      const result = toTransactionRaw(mockedTransaction);

      expect(result.family).toEqual(mockedTransaction.family);
      expect(result.type).toEqual(TRANSACTION_TYPE.TRANSFER);
      expect(result.fees).toEqual("5000");
      expect(result.amountRecord).toBeUndefined();
      expect(result.feeRecord).toBeUndefined();
    });

    it("should convert transaction to raw with records for private transfer", () => {
      const mockedTransaction = getMockedTransaction({
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        amount: new BigNumber(1000000),
        fees: new BigNumber(5000),
        amountRecord: "record_1",
        feeRecord: "record_2",
      });

      const result = toTransactionRaw(mockedTransaction);

      expect(result.type).toEqual(TRANSACTION_TYPE.TRANSFER_PRIVATE);
      expect(result.fees).toEqual("5000");
      expect(result.amountRecord).toEqual("record_1");
      expect(result.feeRecord).toEqual("record_2");
    });

    it("should convert transaction to raw with records for convert private to public", () => {
      const mockedTransaction = getMockedTransaction({
        type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
        amount: new BigNumber(1000000),
        fees: new BigNumber(5000),
        amountRecord: "record_3",
        feeRecord: "record_4",
      });

      const result = toTransactionRaw(mockedTransaction);

      expect(result.type).toEqual(TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC);
      expect(result.amountRecord).toEqual("record_3");
      expect(result.feeRecord).toEqual("record_4");
    });
  });
});
