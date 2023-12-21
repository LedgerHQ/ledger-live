import "../__tests__/test-helpers/setup";
import { makeBridgeCacheSystem } from "../bridge/cache";
import { accountToAccountData } from "../cross";
import {
  importAccountsMakeItems,
  importAccountsReduce,
  fromAccountRaw,
  syncNewAccountsToImport,
} from ".";
import { Account } from "@ledgerhq/types-live";

jest.setTimeout(200000);

test("importAccounts with a set of real data", async () => {
  const accounts = [
    {
      id: "js:2:algorand:32PI2C5HLHMVUF5KMNURLGCTYVIOVJJ2NLHLZ2PIMK567MKMS4RXBSVWQI:",
      seedIdentifier: "32PI2C5HLHMVUF5KMNURLGCTYVIOVJJ2NLHLZ2PIMK567MKMS4RXBSVWQI",
      name: "Algorand legacy 32PI2C5H...RXBSVWQI",
      starred: true,
      used: true,
      derivationMode: "",
      index: 0,
      freshAddress: "32PI2C5HLHMVUF5KMNURLGCTYVIOVJJ2NLHLZ2PIMK567MKMS4RXBSVWQI",
      freshAddressPath: "44'/283'/0'/0/0",
      freshAddresses: [],
      blockHeight: 23066613,
      creationDate: "2022-02-04T13:12:58.000Z",
      operationsCount: 184,
      operations: [],
      pendingOperations: [],
      currencyId: "algorand",
      unitMagnitude: 6,
      lastSyncDate: "2022-08-26T09:24:27.076Z",
      balance: "2100190",
      spendableBalance: "190",
      xpub: "32PI2C5HLHMVUF5KMNURLGCTYVIOVJJ2NLHLZ2PIMK567MKMS4RXBSVWQI",
      subAccounts: [],
      algorandResources: { rewards: "190", nbAssets: 20 },
      swapHistory: [],
    },
    {
      id: "js:2:tron:TRbtdwHowocq8ThZbRnTHgK4JG5sx3fFCK:",
      seedIdentifier: "TRbtdwHowocq8ThZbRnTHgK4JG5sx3fFCK",
      name: "Tron legacy TRbtdwHo...5sx3fFCK",
      starred: true,
      used: true,
      derivationMode: "",
      index: 0,
      freshAddress: "TRbtdwHowocq8ThZbRnTHgK4JG5sx3fFCK",
      freshAddressPath: "44'/195'/0'/0/0",
      freshAddresses: [],
      blockHeight: 43642499,
      creationDate: "2022-07-19T15:32:12.000Z",
      operationsCount: 41,
      operations: [],
      pendingOperations: [],
      currencyId: "tron",
      unitMagnitude: 6,
      lastSyncDate: "2022-08-26T09:24:59.492Z",
      balance: "0",
      spendableBalance: "0",
      xpub: "TRbtdwHowocq8ThZbRnTHgK4JG5sx3fFCK",
      subAccounts: [],
      tronResources: {
        frozen: {},
        unFrozen: {},
        legacyFrozen: {},
        delegatedFrozen: {},
        votes: [],
        tronPower: 0,
        energy: "0",
        bandwidth: {
          freeUsed: "0",
          freeLimit: "1500",
          gainedUsed: "0",
          gainedLimit: "0",
        },
        unwithdrawnReward: "2730",
        lastVotedDate: "2022-07-22T14:39:51.000Z",
        cacheTransactionInfoById: {},
      },
      swapHistory: [],
    },
    {
      id: "js:2:polkadot:15jLBbe9LD6VSUYFkV5Fmo5LhZU5cns9E6g8qcDv5KrKM1eP:polkadotbip44",
      seedIdentifier: "15jLBbe9LD6VSUYFkV5Fmo5LhZU5cns9E6g8qcDv5KrKM1eP",
      name: "Polkadot polkadotbip44 15jLBbe9...5KrKM1eP",
      starred: true,
      used: true,
      derivationMode: "polkadotbip44",
      index: 0,
      freshAddress: "15jLBbe9LD6VSUYFkV5Fmo5LhZU5cns9E6g8qcDv5KrKM1eP",
      freshAddressPath: "44'/354'/0'/0'/0'",
      freshAddresses: [],
      blockHeight: 11771108,
      creationDate: "2022-02-24T14:39:00.007Z",
      operationsCount: 65,
      operations: [],
      pendingOperations: [],
      currencyId: "polkadot",
      unitMagnitude: 10,
      lastSyncDate: "2022-08-26T09:25:00.713Z",
      balance: "15512511464",
      spendableBalance: "15512511464",
      xpub: "15jLBbe9LD6VSUYFkV5Fmo5LhZU5cns9E6g8qcDv5KrKM1eP",
      polkadotResources: {
        controller: null,
        stash: null,
        nonce: 63,
        lockedBalance: "0",
        unlockedBalance: "0",
        unlockingBalance: "0",
        unlockings: [],
        nominations: [],
      },
      swapHistory: [],
    },
    {
      id: "js:2:bsc:0xa22CA840265d3C5CB1846e419B14c6a6CdD06FAB:",
      seedIdentifier: "0xa22CA840265d3C5CB1846e419B14c6a6CdD06FAB",
      name: "Binance Smart Chain legacy 0xa22CA8...CdD06FAB",
      starred: true,
      used: true,
      derivationMode: "",
      index: 0,
      freshAddress: "0xa22CA840265d3C5CB1846e419B14c6a6CdD06FAB",
      freshAddressPath: "44'/60'/0'/0/0",
      freshAddresses: [],
      blockHeight: 20775454,
      syncHash: "[]_655",
      creationDate: "2022-02-04T13:11:32.001Z",
      operationsCount: 21,
      operations: [],
      pendingOperations: [],
      currencyId: "bsc",
      unitMagnitude: 18,
      lastSyncDate: "2022-08-26T09:25:01.109Z",
      balance: "3128019430408477",
      spendableBalance: "3128019430408477",
      xpub: "0xa22CA840265d3C5CB1846e419B14c6a6CdD06FAB",
      subAccounts: [],
      swapHistory: [],
    },
  ].map(fromAccountRaw);

  const localCache = {};
  const bridgeCache = makeBridgeCacheSystem({
    saveData(c, d) {
      localCache[c.id] = d;
      return Promise.resolve();
    },

    getData(c) {
      return Promise.resolve(localCache[c.id]);
    },
  });

  const result = {
    accounts: accounts.map(accountToAccountData),
    settings: { currenciesSettings: {}, pairExchanges: {} },
    meta: { exporterName: "Test", exporterVersion: "0" },
  };

  const accountsState = [];

  const items = importAccountsMakeItems({
    result,
    accounts: accountsState,
  });
  const selectedAccounts = accounts.map(a => a.id);
  const syncResult = await syncNewAccountsToImport({ items, selectedAccounts }, bridgeCache);
  const reduced = importAccountsReduce(accountsState, {
    items,
    selectedAccounts,
    syncResult,
  });
  expect(reduced.length).toEqual(4);
  expect((reduced[0] as AlgorandAccount).algorandResources).toBeDefined();
  expect((reduced[1] as TronAccount).tronResources).toBeDefined();
  expect((reduced[2] as PolkadotAccount).polkadotResources).toBeDefined();
  expect(reduced[0].operations.length).toBeGreaterThan(1);
  expect(reduced[1].operations.length).toBeGreaterThan(1);
  expect(reduced[2].operations.length).toBeGreaterThan(1);
  expect(reduced[3].operations.length).toBeGreaterThan(1);
});

type AlgorandAccount = Account & { algorandResources: any };
type TronAccount = Account & { tronResources: any };
type PolkadotAccount = Account & { polkadotResources: any };
