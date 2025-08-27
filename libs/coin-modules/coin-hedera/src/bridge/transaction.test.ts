import BigNumber from "bignumber.js";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "../transaction";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import {
  getMockedTransaction,
  getMockedTransactionRaw,
} from "../test/fixtures/transaction.fixture";

describe("transaction", () => {
  const mockedAccount = getMockedAccount();
  const mockedTransaction = getMockedTransaction({
    amount: new BigNumber(100000000),
    recipient: "0.0.3",
  });
  const mockedTransactionRaw = getMockedTransactionRaw({
    amount: "100000000",
    recipient: "0.0.3",
  });

  test("formatTransaction", () => {
    const result = formatTransaction(mockedTransaction, mockedAccount);
    const nonBreakingSpace = String.fromCharCode(160);
    const string = `SEND 1${nonBreakingSpace}HBAR\nTO 0.0.3`;

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
