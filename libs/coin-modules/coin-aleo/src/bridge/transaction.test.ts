import BigNumber from "bignumber.js";
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
});
