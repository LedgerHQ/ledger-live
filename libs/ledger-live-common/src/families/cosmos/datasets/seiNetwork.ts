import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [
    "cosmosResources",
    "operationsCount",
    "operations",
    "pendingOperations",
  ],
  scanAccounts: [
    {
      name: "sei_network seed 1",
      apdus: `
        => 5504000018037365692c00008076000080000000800000000000000000
        <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e837365693167796175766c3434713261706e33753361756a6d333671387a726a37347672796335307066679000
        => 5504000018037365692c00008076000080000000800000000000000000
        <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e837365693167796175766c3434713261706e33753361756a6d333671387a726a37347672796335307066679000
        => 5504000018037365692c00008076000080010000800000000000000000
        <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f7365693176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e6530667a6d32309000
        `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops", "pendingOperations are cleaned up"],
      raw: {
        id: "js:2:sei_network:sei1gyauvl44q2apn3u3aujm36q8zrj74vryc50pfg:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Frozen",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "sei1gyauvl44q2apn3u3aujm36q8zrj74vryc50pfg",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [
          {
            address: "sei1gyauvl44q2apn3u3aujm36q8zrj74vryc50pfg",
            derivationPath: "44'/118'/0'/0/0",
          },
        ],
        blockHeight: 30141265,
        creationDate: "2023-10-05T07:51:50.000Z",
        currencyId: "sei_network",
        unitMagnitude: 6,
        lastSyncDate: "2023-10-05T07:57:42.286Z",
        balance: "278991",
        spendableBalance: "128991",
        balanceHistoryCache: {
          HOUR: { balances: [0], latestDate: 1696489200000 },
          DAY: { balances: [0], latestDate: 1696456800000 },
          WEEK: { balances: [0], latestDate: 1696111200000 },
        },
        xpub: "sei1gyauvl44q2apn3u3aujm36q8zrj74vryc50pfg",
        swapHistory: [],
        pendingOperations: [],
        operations: [],
      },
    },
  ],
};

export default dataset;
