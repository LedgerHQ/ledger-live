import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import network from "../../../network";

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

describe("js-estimateMaxSpendable", () => {
  let estimatedFees = new BigNumber("212800").multipliedBy(2);

  it("should return hedera price if available", async () => {
    // If get hedera price works, use real estimate, otherwise fallback to hard coded
    let hederaPrice;
    try {
      const { data } = await network({
        method: "GET",
        url: "https://countervalues.live.ledger.com/latest/direct?pairs=hbar:usd",
      });
      hederaPrice = data[0];
    } catch {
      hederaPrice = 0;
    }

    if (hederaPrice) {
      estimatedFees = new BigNumber("0.0001").dividedBy(
        new BigNumber(hederaPrice)
      );
    }
  });

  test("estimateMaxSpendable", async () => {
    const result = await estimateMaxSpendable({
      account,
    });
    const data = account.balance.minus(estimatedFees);

    expect(result).toEqual(data);
  });
});
