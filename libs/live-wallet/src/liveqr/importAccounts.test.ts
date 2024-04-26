import type { AccountRaw } from "@ledgerhq/types-live";
import {
  SyncNewAccountsOutput,
  importAccountsMakeItems,
  importAccountsReduce,
} from "./importAccounts";
import { setSupportedCurrencies } from "@ledgerhq/coin-framework/currencies/index";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { AccountData, accountDataToAccount } from "./cross";

setSupportedCurrencies(["ethereum"]);
describe("importAccountsMakeItems", () => {
  test("importing ethereum accounts", () => {
    const resultAccounts: AccountData[] = [
      {
        id: "js:1:ethereum:0x01:",
        name: "Ethereum 1",
        seedIdentifier: "seed",
        derivationMode: "",
        freshAddress: "0x01",
        currencyId: "ethereum",
        index: 0,
        balance: "51281813126095913",
      },
      {
        id: "js:1:ethereum:0x02:",
        name: "Ethereum 2",
        seedIdentifier: "seed",
        derivationMode: "",
        freshAddress: "0x02",
        currencyId: "ethereum",
        index: 1,
        balance: "1081392000000000",
      },
      {
        id: "js:1:ethereum:0x04:",
        name: "Ethereum 4",
        seedIdentifier: "seed",
        derivationMode: "",
        freshAddress: "0x04",
        currencyId: "ethereum",
        index: 3,
        balance: "1000000000000000",
      },
      {
        id: "js:1:ethereum:0x03:",
        name: "ETH3 name edited",
        seedIdentifier: "seed",
        derivationMode: "",
        freshAddress: "0x03",
        currencyId: "ethereum",
        index: 2,
        balance: "0",
      },
      {
        id: "js:1:ethereum:0x05:",
        name: "Ethereum 5",
        seedIdentifier: "seed",
        derivationMode: "",
        freshAddress: "0x05",
        currencyId: "ethereum",
        index: 4,
        balance: "0",
      },
    ];
    const result = {
      meta: {
        exporterName: "desktop",
        exporterVersion: "1.12.0",
      },
      accounts: resultAccounts,
      settings: {
        counterValue: "USD",
        currenciesSettings: {},
        pairExchanges: {},
        developerModeEnabled: false,
      },
    };
    const accounts = [
      <AccountRaw>{
        id: "js:1:ethereum:0x01:",
        seedIdentifier: "0x01",
        name: "Ethereum 1",
        derivationMode: "",
        index: 0,
        freshAddress: "0x01",
        freshAddressPath: "44'/60'/0'/0/0",
        freshAddresses: [],
        blockHeight: 8168983,
        operations: [],
        pendingOperations: [],
        currencyId: "ethereum",
        lastSyncDate: "2019-07-17T15:13:30.318Z",
        balance: "51281813126095910",
      },
      <AccountRaw>{
        id: "js:1:ethereum:0x02:",
        seedIdentifier: "0x02",
        name: "Ethereum 2",
        derivationMode: "",
        index: 1,
        freshAddress: "0x02",
        freshAddressPath: "44'/60'/1'/0/0",
        freshAddresses: [],
        blockHeight: 8168983,
        operations: [],
        pendingOperations: [],
        currencyId: "ethereum",
        lastSyncDate: "2019-07-17T15:13:29.306Z",
        balance: "1081392000000000",
      },
      <AccountRaw>{
        id: "js:1:ethereum:0x03:",
        seedIdentifier: "seed",
        name: "Ethereum 3",
        derivationMode: "",
        index: 2,
        freshAddress: "0x03",
        freshAddressPath: "44'/60'/2'/0/0",
        freshAddresses: [],
        blockHeight: 8168983,
        operations: [],
        pendingOperations: [],
        currencyId: "ethereum",
        lastSyncDate: "2019-07-17T15:13:29.306Z",
        balance: "1081392000000000",
      },
    ].map(a => fromAccountRaw(a));

    const { items, accountNames } = importAccountsMakeItems({
      result,
      accounts,
    });
    expect(items).toMatchObject([
      {
        initialAccountId: "js:1:ethereum:0x04:",
        account: { id: "js:1:ethereum:0x04:" },
        mode: "create",
      },
      {
        initialAccountId: "js:1:ethereum:0x05:",
        account: { id: "js:1:ethereum:0x05:" },
        mode: "create",
      },
    ]);
    const syncResult: SyncNewAccountsOutput = {
      failed: {},
      synchronized: {},
    };
    result.accounts.forEach(a => {
      syncResult.synchronized[a.id] = accountDataToAccount(a)[0];
    });
    const reduced = importAccountsReduce(accounts, {
      items,
      selectedAccounts: ["js:1:ethereum:0x03:", "js:1:ethereum:0x02:", "js:1:ethereum:0x05:"],
      syncResult,
    });
    expect(accountNames.get("js:1:ethereum:0x03:")).toEqual("ETH3 name edited");
    expect(reduced).toMatchObject([
      { id: "js:1:ethereum:0x01:" },
      { id: "js:1:ethereum:0x02:" },
      { id: "js:1:ethereum:0x03:" },
      { id: "js:1:ethereum:0x05:" },
    ]);
  });
});
