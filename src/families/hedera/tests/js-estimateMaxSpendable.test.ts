import BigNumber from "bignumber.js";
import type { Account } from "../../../types";
import estimateMaxSpendable from "../js-estimateMaxSpendable";

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
    id: "",
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

describe("js-estimateMaxSpendable", () => {
  const estimatedFees = new BigNumber("83300").multipliedBy(2);

  test("estimateMaxSpendable", async () => {
    const result = await estimateMaxSpendable({
      account,
    });
    const data = account.balance.minus(estimatedFees);

    expect(result).toEqual(data);
  });
});
