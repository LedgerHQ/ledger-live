import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import { getEstimatedFees } from "../utils";

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

describe("js-estimateMaxSpendable", () => {
  let estimatedFees = new BigNumber("150200").multipliedBy(2); // 0.001502 ℏ (as of 2023-03-14)

  beforeAll(async () => {
    estimatedFees = await getEstimatedFees(account);
  });

  test("estimateMaxSpendable", async () => {
    const result = await estimateMaxSpendable({
      account,
    });
    const data = account.balance.minus(estimatedFees);

    expect(result).toEqual(data);
  });
});
