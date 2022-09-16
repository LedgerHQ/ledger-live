import BigNumber from "bignumber.js";

import { getCryptoCurrencyById } from "../../currencies";
import { syncAccount } from "../../__tests__/test-helpers/bridge";
import { defaultTronResources } from "./utils";
import bridge from "./bridge/js";
import { Account } from "@ledgerhq/types-live";
import { TronAccount } from "./types";

jest.setTimeout(30000);

const tron = getCryptoCurrencyById("tron");
const defaultSyncConfig = {
  paginationConfig: {},
  blacklistedTokenIds: [],
};

const dummyAccount: Account = {
  type: "Account",
  id: "",
  derivationMode: "",
  seedIdentifier: "",
  name: "Tron",
  starred: false,
  used: false,
  currency: tron,
  index: 0,
  freshAddress: "",
  freshAddressPath: "",
  swapHistory: [],
  freshAddresses: [],
  blockHeight: 0,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  unit: tron.units[0],
  lastSyncDate: new Date(0),
  creationDate: new Date(),
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: undefined,
    },
    DAY: {
      balances: [],
      latestDate: undefined,
    },
    WEEK: {
      balances: [],
      latestDate: undefined,
    },
  },
};

describe("Tron Accounts", () => {
  test("should always have tronResources", async () => {
    const account = await syncAccount(
      bridge.accountBridge,
      dummyAccount,
      defaultSyncConfig
    );

    expect((account as TronAccount).tronResources).toEqual(
      defaultTronResources
    );
  });
});
