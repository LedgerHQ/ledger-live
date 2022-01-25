import {
  importAccountsMakeItems,
  importAccountsReduce,
  fromAccountRaw,
} from "../../account";
import { setSupportedCurrencies } from "../../currencies";
import { AccountRaw } from "../../types";
import { setPlatformVersion } from "../../platform/version";

setPlatformVersion("0.0.1");

setSupportedCurrencies(["ethereum"]);
describe("importAccountsMakeItems", () => {
  // TODO we need to change the dataset as we no longer are migrating away from JS to Libcore but kinda the reverse
  test.skip("should migrate ethereum accounts", () => {
    const result = {
      meta: {
        exporterName: "desktop",
        exporterVersion: "1.12.0",
      },
      accounts: [
        {
          id: "libcore:1:ethereum:xpub1:",
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
          id: "libcore:1:ethereum:xpub2:",
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
          id: "libcore:1:ethereum:xpub4:",
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
          id: "libcore:1:ethereum:xpub3:",
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
          id: "libcore:1:ethereum:xpub5:",
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
        id: "ethereumjs:2:ethereum:0x01:",
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
        id: "ethereumjs:2:ethereum:0x02:",
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
        id: "libcore:1:ethereum:xpub3:",
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
        initialAccountId: "libcore:1:ethereum:xpub4:",
        account: {
          id: "libcore:1:ethereum:xpub4:",
          name: "Ethereum 4",
        },
        mode: "create",
      },
      {
        initialAccountId: "libcore:1:ethereum:xpub5:",
        account: {
          id: "libcore:1:ethereum:xpub5:",
          name: "Ethereum 5",
        },
        mode: "create",
      },
      {
        initialAccountId: "ethereumjs:2:ethereum:0x01:",
        account: {
          id: "libcore:1:ethereum:xpub1:",
          name: "Ethereum 1",
        },
        mode: "update",
      },
      {
        initialAccountId: "ethereumjs:2:ethereum:0x02:",
        account: {
          id: "libcore:1:ethereum:xpub2:",
          name: "Ethereum 2",
        },
        mode: "update",
      },
      {
        initialAccountId: "libcore:1:ethereum:xpub3:",
        account: {
          id: "libcore:1:ethereum:xpub3:",
          name: "ETH3 name edited",
        },
        mode: "update",
      },
    ]);
    const reduced = importAccountsReduce(accounts, {
      items,
      selectedAccounts: [
        "libcore:1:ethereum:xpub3:",
        "libcore:1:ethereum:xpub2:",
        "libcore:1:ethereum:xpub5:",
      ],
    });
    expect(reduced).toMatchObject([
      {
        id: "ethereumjs:2:ethereum:0x01:",
        name: "Ethereum 1",
      },
      {
        id: "libcore:1:ethereum:xpub2:",
        name: "Ethereum 2",
      },
      {
        id: "libcore:1:ethereum:xpub3:",
        name: "ETH3 name edited",
      },
      {
        id: "libcore:1:ethereum:xpub5:",
        name: "Ethereum 5",
      },
    ]);
  });
});
