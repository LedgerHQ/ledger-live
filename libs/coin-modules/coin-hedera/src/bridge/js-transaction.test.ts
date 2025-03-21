import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction } from "../types";
import { createBridges } from ".";

const account: Account = {
  type: "Account",
  id: "",
  seedIdentifier: "",
  derivationMode: "",
  index: 0,
  freshAddress: "",
  freshAddressPath: "",
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
};

const transaction: Transaction = {
  family: "hedera",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
};

describe("js-transaction", () => {
  let bridge: ReturnType<typeof createBridges>;

  beforeAll(() => {
    const signer = jest.fn();
    bridge = createBridges(signer);
  });
  test("createTransaction", () => {
    const data = transaction;
    const result = bridge.accountBridge.createTransaction(account);

    expect(result).toEqual(data);
  });

  test("updateTransaction", () => {
    const patch = {
      amount: new BigNumber(5),
      recipient: "0.0.3",
      useAllAmount: true,
    };
    const data = { ...transaction, ...patch };
    const result = updateTransaction(transaction, patch);

    expect(result).toEqual(data);
  });

  test("prepareTransaction", async () => {
    const data = transaction;
    const result = await bridge.accountBridge.prepareTransaction(account, transaction);

    expect(result).toEqual(data);
  });
});
