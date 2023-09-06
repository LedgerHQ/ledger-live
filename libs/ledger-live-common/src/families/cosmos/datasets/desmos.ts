import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import BigNumber from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "desmos seed 1",
      apdus: `
      => 550400001b066465736d6f732c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836465736d6f733167796175766c3434713261706e33753361756a6d333671387a726a373476727970716e3863339000
      => 550400001b066465736d6f732c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836465736d6f733167796175766c3434713261706e33753361756a6d333671387a726a373476727970716e3863339000
      => 550400001b066465736d6f732c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f6465736d6f733176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e656b6137616d6b9000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:desmos:desmos1gyauvl44q2apn3u3aujm36q8zrj74vrypqn8c3:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Desmos 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "desmos1gyauvl44q2apn3u3aujm36q8zrj74vrypqn8c3",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [],
        blockHeight: 8171679,
        creationDate: "2023-04-18T13:43:32.000Z",
        operationsCount: 4,
        operations: [],
        pendingOperations: [],
        currencyId: "desmos",
        unitMagnitude: 6,
        lastSyncDate: "2023-04-19T08:50:37.675Z",
        balance: "9998421",
        spendableBalance: "9898421",
        balanceHistoryCache: {
          HOUR: {
            balances: [
              0, 10000000, 9998421, 9998421, 9998421, 9998421, 9998421, 9998421, 9998421, 9998421,
              9998421, 9998421, 9998421, 9998421, 9998421, 9998421, 9998421, 9998421, 9998421,
              9998421,
            ],
            latestDate: 1681891200000,
          },
          DAY: { balances: [0, 9998421], latestDate: 1681855200000 },
          WEEK: { balances: [0], latestDate: 1681596000000 },
        },
        xpub: "desmos1gyauvl44q2apn3u3aujm36q8zrj74vrypqn8c3",
        swapHistory: [],
      },
      transactions: [
        {
          name: "NO_NAME",
          transaction: fromTransactionRaw({
            amount: "100000",
            recipient: "desmos103h9fdkgm7ucccujyunck5lfejrvthd7r6284a",
            useAllAmount: false,
            family: "cosmos",
            mode: "send",
            networkInfo: null,
            fees: "203",
            gas: "81125",
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
