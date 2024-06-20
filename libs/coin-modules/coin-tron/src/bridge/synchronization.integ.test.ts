import BigNumber from "bignumber.js";
import { firstValueFrom, reduce } from "rxjs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { Account, AccountBridge, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import { TronCoinConfig } from "../config";
import { defaultTronResources } from "../logic/utils";
import { Transaction, TronAccount } from "../types";
import { createBridges } from "./index";

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
  let bridge: ReturnType<typeof createBridges>;

  beforeAll(() => {
    const signer = jest.fn();
    const coinConfig = (): TronCoinConfig => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    });
    bridge = createBridges(signer, coinConfig);
  });

  test("should always have tronResources", async () => {
    const account = await syncAccount<Transaction, TronAccount>(
      bridge.accountBridge,
      dummyAccount,
      defaultSyncConfig,
    );

    expect(account.tronResources).toEqual(defaultTronResources);
  });

  test.each([
    "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre",
    "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj",
    "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi",
    "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
    "TUxd6v64YTWkfpFpNDdtgc5Ps4SfGxwizT",
    "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh",
  ])("should always be sync wihtout error for address %s", async (accountId: string) => {
    const account = await syncAccount<Transaction, TronAccount>(
      bridge.accountBridge,
      { ...dummyAccount, id: `js:2:tron:${accountId}:`, freshAddress: accountId },
      defaultSyncConfig,
    );

    expect(account.id).toEqual(`js:2:tron:${accountId}:`);
  });
});
