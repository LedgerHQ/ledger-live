import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionRaw } from "../types";
import {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
} from "../transaction";

const account: Account = {
  type: "Account",
  id: "",
  seedIdentifier: "",
  derivationMode: "",
  index: 0,
  freshAddress: "",
  freshAddressPath: "",
  freshAddresses: [],
  name: "",
  starred: false,
  used: false,
  balance: new BigNumber(200000),
  spendableBalance: new BigNumber(0),
  creationDate: new Date(),
  blockHeight: 0,
  currency: {
    type: "CryptoCurrency",
    id: "hedera",
    managerAppName: "",
    coinType: 0,
    scheme: "",
    color: "",
    family: "",
    explorerViews: [],
    name: "",
    ticker: "",
    units: [],
  },
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
  unit: {
    name: "",
    code: "",
    magnitude: 0,
    showAllDigits: undefined,
    prefixCode: undefined,
  },
};

const transaction: Transaction = {
  family: "hedera",
  amount: new BigNumber(1),
  recipient: "0.0.3",
};

const transactionRaw: TransactionRaw = {
  family: "hedera",
  amount: "1",
  recipient: "0.0.3",
};

describe("transaction", () => {
  test("formatTransaction", () => {
    const result = formatTransaction(transaction, account);
    const string = `SEND 1\nTO 0.0.3`;

    expect(result).toEqual(string);
  });

  test("fromTransactionRaw", () => {
    const result = fromTransactionRaw(transactionRaw);
    const data = transaction;

    expect(result).toEqual(data);
  });

  test("toTransactionRaw", () => {
    const result = toTransactionRaw(transaction);
    const data = transactionRaw;

    expect(result).toEqual(data);
  });
});
