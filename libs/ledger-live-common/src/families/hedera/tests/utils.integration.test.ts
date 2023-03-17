import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { calculateAmount } from "../utils";
import network from "../../../network";

// Balance is 1 Hbar
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
  balance: new BigNumber(100000000),
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
  let estimatedFees = new BigNumber("150200").multipliedBy(2); // 0.001502 ℏ (as of 2023-03-14)

  it("should return hedera price if available", async () => {
    // If get hedera price works, use real estimate, otherwise fallback to hard coded
    try {
      const { data } = await network({
        method: "GET",
        url: "https://countervalues.live.ledger.com/latest/direct?pairs=hbar:usd",
      });
      estimatedFees = new BigNumber(10000).dividedBy(data[0]);
    } catch {
      console.error("Could not fetch Hedera price");
    }
  });

  test("calculateAmount transaction.useAllAmount = true", async () => {
    transaction.useAllAmount = true;

    const amount = account.balance.minus(estimatedFees);
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
