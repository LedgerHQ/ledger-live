import type { AccountRaw } from "@ledgerhq/types-live";
import {
  importAccountsMakeItems,
  importAccountsReduce,
  fromAccountRaw,
} from ".";
import { setSupportedCurrencies } from "../currencies";
import { PLATFORM_VERSION } from "../platform/constants";
import { setPlatformVersion } from "../platform/version";
import { WALLET_API_VERSION } from "../wallet-api/constants";
import { setWalletAPIVersion } from "../wallet-api/version";

setPlatformVersion(PLATFORM_VERSION);
setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies(["ethereum"]);
describe("importAccountsMakeItems", () => {
  test("importing ethereum accounts", () => {
    const result = {
      meta: {
        exporterName: "desktop",
        exporterVersion: "1.12.0",
      },
      accounts: [
        {
          id: "js:1:ethereum:0x01:",
          name: "Ethereum 1",
          seedIdentifier: "seed",
          derivationMode: "",
          freshAddress: "0x01",
          currencyId: "ethereum",
          index: 0,
          balance: "51281813126095913",
          swapHistory: [],
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
          swapHistory: [],
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
          swapHistory: [],
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
          swapHistory: [],
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
          swapHistory: [],
        },
      ],
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
        unitMagnitude: 18,
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
        unitMagnitude: 18,
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
        unitMagnitude: 18,
        lastSyncDate: "2019-07-17T15:13:29.306Z",
        balance: "1081392000000000",
      },
    ].map(fromAccountRaw);
    const items = importAccountsMakeItems({
      result,
      accounts,
    });
    expect(items).toMatchObject([
      {
        initialAccountId: "js:1:ethereum:0x04:",
        account: { id: "js:1:ethereum:0x04:", name: "Ethereum 4" },
        mode: "create",
      },
      {
        initialAccountId: "js:1:ethereum:0x05:",
        account: { id: "js:1:ethereum:0x05:", name: "Ethereum 5" },
        mode: "create",
      },
      {
        initialAccountId: "js:1:ethereum:0x03:",
        account: { id: "js:1:ethereum:0x03:", name: "ETH3 name edited" },
        mode: "update",
      },
      {
        initialAccountId: "js:1:ethereum:0x01:",
        account: { id: "js:1:ethereum:0x01:", name: "Ethereum 1" },
        mode: "id",
      },
      {
        initialAccountId: "js:1:ethereum:0x02:",
        account: { id: "js:1:ethereum:0x02:", name: "Ethereum 2" },
        mode: "id",
      },
    ]);
    const syncResult = {
      failed: {},
      synchronized: {},
    };
    result.accounts.forEach((a) => {
      syncResult.synchronized[a.id] = a;
    });
    const reduced = importAccountsReduce(accounts, {
      items,
      selectedAccounts: [
        "js:1:ethereum:0x03:",
        "js:1:ethereum:0x02:",
        "js:1:ethereum:0x05:",
      ],
      syncResult,
    });
    expect(reduced).toMatchObject([
      { id: "js:1:ethereum:0x01:", name: "Ethereum 1" },
      { id: "js:1:ethereum:0x02:", name: "Ethereum 2" },
      { id: "js:1:ethereum:0x03:", name: "ETH3 name edited" },
      { id: "js:1:ethereum:0x05:", name: "Ethereum 5" },
    ]);
  });
});
