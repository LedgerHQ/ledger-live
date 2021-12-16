import {
  accountToAccountData,
  accountDataToAccount,
  AccountData,
} from "../../../cross";
import BigNumber from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";
import type { Account } from "../../../types";
import type {
  HederaResources,
  HederaResourcesRaw,
} from "../../../families/hedera/types";

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

const accountData: AccountData = {
  id: "1:2:3:4:hederaBip44",
  currencyId: "hedera",
  freshAddress: "",
  index: 0,
  balance: "1",
  derivationMode: "hederaBip44",
  seedIdentifier: "",
  name: "",
};

const hederaResources: HederaResources = {
  accountId: AccountId.fromString("0.0.3"),
};

const hederaResourcesRaw: HederaResourcesRaw = {
  accountId: "0.0.3",
};

describe("cross", () => {
  test("accountToAccountData", () => {
    const data = hederaResourcesRaw;

    account.hederaResources = hederaResources;
    const result = accountToAccountData(account).hederaResources;

    expect(result).toEqual(data);
  });

  test("accountDataToAccount", () => {
    const data = hederaResources;

    accountData.hederaResources = hederaResourcesRaw;
    const result = accountDataToAccount(accountData).hederaResources;

    expect(result).toEqual(data);
  });
});
