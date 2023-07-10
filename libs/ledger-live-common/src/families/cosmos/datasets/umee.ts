import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import BigNumber from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "umee seed 1",
      apdus: `
      => 550400001904756d65652c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83756d65653167796175766c3434713261706e33753361756a6d333671387a726a373476727938777267746d9000
      => 550400001904756d65652c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83756d65653167796175766c3434713261706e33753361756a6d333671387a726a373476727938777267746d9000
      => 550400001904756d65652c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f756d65653176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e65736e776a67759000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:umee:umee1gyauvl44q2apn3u3aujm36q8zrj74vry8wrgtm:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Umee 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "umee1gyauvl44q2apn3u3aujm36q8zrj74vry8wrgtm",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [],
        blockHeight: 6163108,
        creationDate: "2023-04-18T13:44:20.000Z",
        operationsCount: 4,
        operations: [],
        pendingOperations: [],
        currencyId: "umee",
        unitMagnitude: 6,
        lastSyncDate: "2023-04-19T09:37:58.369Z",
        balance: "9899013",
        spendableBalance: "9799013",
        balanceHistoryCache: {
          HOUR: {
            balances: [
              0, 10000000, 10000000, 10000000, 10000000, 9899013, 9899013, 9899013, 9899013,
              9899013, 9899013, 9899013, 9899013, 9899013, 9899013, 9899013, 9899013, 9899013,
              9899013, 9899013, 9899013,
            ],
            latestDate: 1681894800000,
          },
          DAY: { balances: [0, 9899013], latestDate: 1681855200000 },
          WEEK: { balances: [0], latestDate: 1681596000000 },
        },
        xpub: "umee1gyauvl44q2apn3u3aujm36q8zrj74vry8wrgtm",
        swapHistory: [],
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "100000",
            recipient: "umee103h9fdkgm7ucccujyunck5lfejrvthd7956gxh",
            useAllAmount: false,
            family: "cosmos",
            mode: "send",
            networkInfo: null,
            fees: "8744",
            gas: "87440",
            validators: [],
            memo: "",
            sourceValidator: "",
          }),
          expectedStatus: () => ({
            errors: {},
            warnings: {},
            amount: BigNumber("100000"),
          }),
        },
      ],
    },
  ],
};

export default dataset;
