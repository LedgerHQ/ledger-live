import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { calculateAmount } from "../utils";

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
  recipient: "",
  useAllAmount: undefined,
};

describe("utils", () => {
  const estimatedFees = new BigNumber("83300");

  test("calculateAmount transaction.useAllAmount = true", async () => {
    transaction.useAllAmount = true;

    const amount = account.balance.minus(estimatedFees.multipliedBy(2));
    const totalSpent = amount.plus(estimatedFees);
    const data = {
      amount,
      totalSpent,
    };

    const result = await calculateAmount({
      account,
      transaction,
    });

    expect(result).toEqual(data);
  });

  test("calculateAmount transaction.useAllAmount = false", async () => {
    transaction.useAllAmount = false;

    const amount = transaction.amount;
    const totalSpent = amount.plus(estimatedFees);
    const data = {
      amount,
      totalSpent,
    };

    const result = await calculateAmount({
      account,
      transaction,
    });

    expect(result).toEqual(data);
  });
});
