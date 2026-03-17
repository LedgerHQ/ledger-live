import BigNumber from "bignumber.js";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import {
  getMockedTransaction,
  getMockedTransactionRaw,
  mockedTransferPrivateTransactionRaw,
  mockedTransferPrivateTransaction,
  mockedTransferPrivateNullRecordsTransactionRaw,
  mockedTransferPrivateNullRecordsTransaction,
  mockedConvertPrivateToPublicTransactionRaw,
  mockedConvertPrivateToPublicTransaction,
  mockedConvertPrivateToPublicNullRecordsTransactionRaw,
  mockedConvertPrivateToPublicNullRecordsTransaction,
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

  test("formatTransaction", () => {
    const result = formatTransaction(mockedTransaction, mockedAccount);
    const nonBreakingSpace = String.fromCharCode(160);
    const string = `SEND 1${nonBreakingSpace}ALEO\nTO ${mockedTransaction.recipient}`;

    expect(result).toEqual(string);
  });

  test("fromTransactionRaw", () => {
    const result = fromTransactionRaw(mockedTransactionRaw);
    const data = mockedTransaction;

    expect(result).toEqual(data);
  });

  test("toTransactionRaw", () => {
    const result = toTransactionRaw(mockedTransaction);
    const data = mockedTransactionRaw;

    expect(result).toEqual(data);
  });

  test("fromTransactionRaw - TRANSFER_PRIVATE", () => {
    const result = fromTransactionRaw(mockedTransferPrivateTransactionRaw);
    const data = mockedTransferPrivateTransaction;

    expect(result).toEqual(data);
  });

  test("toTransactionRaw - TRANSFER_PRIVATE", () => {
    const result = toTransactionRaw(mockedTransferPrivateTransaction);
    const data = mockedTransferPrivateTransactionRaw;

    expect(result).toEqual(data);
  });

  test("fromTransactionRaw - TRANSFER_PRIVATE with null records", () => {
    const result = fromTransactionRaw(mockedTransferPrivateNullRecordsTransactionRaw);
    const data = mockedTransferPrivateNullRecordsTransaction;

    expect(result).toEqual(data);
  });

  test("toTransactionRaw - TRANSFER_PRIVATE with null records", () => {
    const result = toTransactionRaw(mockedTransferPrivateNullRecordsTransaction);
    const data = mockedTransferPrivateNullRecordsTransactionRaw;

    expect(result).toEqual(data);
  });

  test("fromTransactionRaw - CONVERT_PRIVATE_TO_PUBLIC", () => {
    const result = fromTransactionRaw(mockedConvertPrivateToPublicTransactionRaw);
    const data = mockedConvertPrivateToPublicTransaction;

    expect(result).toEqual(data);
  });

  test("toTransactionRaw - CONVERT_PRIVATE_TO_PUBLIC", () => {
    const result = toTransactionRaw(mockedConvertPrivateToPublicTransaction);
    const data = mockedConvertPrivateToPublicTransactionRaw;

    expect(result).toEqual(data);
  });

  test("fromTransactionRaw - CONVERT_PRIVATE_TO_PUBLIC with null records", () => {
    const result = fromTransactionRaw(mockedConvertPrivateToPublicNullRecordsTransactionRaw);
    const data = mockedConvertPrivateToPublicNullRecordsTransaction;

    expect(result).toEqual(data);
  });

  test("toTransactionRaw - CONVERT_PRIVATE_TO_PUBLIC with null records", () => {
    const result = toTransactionRaw(mockedConvertPrivateToPublicNullRecordsTransaction);
    const data = mockedConvertPrivateToPublicNullRecordsTransactionRaw;

    expect(result).toEqual(data);
  });
});
