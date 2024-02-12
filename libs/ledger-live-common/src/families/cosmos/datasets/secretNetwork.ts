import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import BigNumber from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "secret_network seed 1",
      apdus: `
      => 550400001b067365637265742c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e837365637265743167796175766c3434713261706e33753361756a6d333671387a726a3734767279686132376a349000
      => 550400001b067365637265742c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e837365637265743167796175766c3434713261706e33753361756a6d333671387a726a3734767279686132376a349000
      => 550400001b067365637265742c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f7365637265743176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e6571713879336a9000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:secret_network:secret1gyauvl44q2apn3u3aujm36q8zrj74vryha27j4:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "SecretNetwork 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "secret1gyauvl44q2apn3u3aujm36q8zrj74vryha27j4",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [],
        blockHeight: 9251185,
        creationDate: "2023-06-12T12:45:06.797Z",
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "secret_network",
        unitMagnitude: 6,
        lastSyncDate: "2023-06-12T12:45:06.797Z",
        balance: "1964000",
        spendableBalance: "1232751",
        balanceHistoryCache: {
          HOUR: { balances: [], latestDate: 1686571200000 },
          DAY: { balances: [], latestDate: 1686520800000 },
          WEEK: { balances: [], latestDate: 1686434400000 },
        },
        xpub: "secret1gyauvl44q2apn3u3aujm36q8zrj74vryha27j4",
        swapHistory: [],
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "100000",
            recipient: "secret1gyauvl44q2apn3u3aujm36q8zrj74vryha27j4",
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
