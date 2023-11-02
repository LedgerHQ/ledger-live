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
      name: "dydx seed 1",
      apdus: `
        => 550400001904647964782c00008076000080000000800000000000000000
        <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83647964783167796175766c3434713261706e33753361756a6d333671387a726a37347672797570736e30379000
        => 550400001904647964782c00008076000080000000800000000000000000
        <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83647964783167796175766c3434713261706e33753361756a6d333671387a726a37347672797570736e30379000
        => 550400001904647964782c00008076000080010000800000000000000000
        <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f647964783176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e657475616676659000
        `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:dydx:dydx1gyauvl44q2apn3u3aujm36q8zrj74vryupsn07:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "dYdX 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "dydx1gyauvl44q2apn3u3aujm36q8zrj74vryupsn07",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [
          {
            address: "dydx1gyauvl44q2apn3u3aujm36q8zrj74vryupsn07",
            derivationPath: "44'/118'/0'/0/0",
          },
        ],
        blockHeight: 406953,
        creationDate: "2023-11-02T08:01:16.412Z",
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "dydx",
        unitMagnitude: 18,
        lastSyncDate: "2023-11-02T08:01:16.412Z",
        balance: "7620812500000000",
        spendableBalance: "7520812500000000",
        balanceHistoryCache: {
          HOUR: { balances: [], latestDate: 1698912000000 },
          DAY: { balances: [], latestDate: 1698879600000 },
          WEEK: { balances: [], latestDate: 1698534000000 },
        },
        xpub: "dydx1gyauvl44q2apn3u3aujm36q8zrj74vryupsn07",
        swapHistory: [],
      },
      transactions: [],
    },
  ],
};

export default dataset;
