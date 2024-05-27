import BigNumber from "bignumber.js";

import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { defaultTronResources } from "./logic/utils";
import { createBridges } from "./bridge/index";
import { Account, AccountBridge, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import { Transaction, TronAccount } from "./types";
import { firstValueFrom, reduce } from "rxjs";
import { TronCoinConfig } from "./config";

jest.setTimeout(30000);

const tron = getCryptoCurrencyById("tron");
const defaultSyncConfig = {
  paginationConfig: {},
  blacklistedTokenIds: [],
};
export function syncAccount<T extends TransactionCommon, A extends Account = Account>(
  bridge: AccountBridge<T, A>,
  account: A,
  syncConfig: SyncConfig = defaultSyncConfig,
): Promise<A> {
  return firstValueFrom(
    bridge.sync(account, syncConfig).pipe(reduce((a, f: (arg0: A) => A) => f(a), account)),
  );
}

const dummyAccount: TronAccount = {
  type: "Account",
  id: "",
  derivationMode: "",
  seedIdentifier: "",
  used: false,
  currency: tron,
  index: 0,
  freshAddress: "",
  freshAddressPath: "",
  swapHistory: [],
  blockHeight: 0,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
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
  tronResources: {} as any,
};

describe("Tron Accounts", () => {
  test("should always have tronResources", async () => {
    const signer = jest.fn();
    const coinConfig = () =>
      ({
        status: {
          type: "active",
        },
        explorer: {
          url: "",
        },
      }) as TronCoinConfig;
    const bridge = createBridges(signer, coinConfig);
    const account = await syncAccount<Transaction, TronAccount>(
      bridge.accountBridge,
      dummyAccount,
      defaultSyncConfig,
    );

    expect(account.tronResources).toEqual(defaultTronResources);
  });
});
