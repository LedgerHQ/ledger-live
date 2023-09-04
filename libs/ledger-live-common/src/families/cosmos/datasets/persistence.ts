import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import BigNumber from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "persistence seed 1",
      apdus: `
      => 55040000200b70657273697374656e63652c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e8370657273697374656e63653167796175766c3434713261706e33753361756a6d333671387a726a37347672796d35637970649000
      => 55040000200b70657273697374656e63652c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e8370657273697374656e63653167796175766c3434713261706e33753361756a6d333671387a726a37347672796d35637970649000
      => 55040000200b70657273697374656e63652c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f70657273697374656e63653176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e65766634377a329000
      => 55040000200b70657273697374656e63652c00008076000080020000800000000000000000
      <= 02ab5f595224110458af5cf96c07f84f7102a61cc775ae4249e02ee17bb5f12c8170657273697374656e6365313772353675646c3039737376383878383563786674783773753072677634763237656a3370309000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:persistence:persistence1gyauvl44q2apn3u3aujm36q8zrj74vrym5cypd:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Persistence 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "persistence1gyauvl44q2apn3u3aujm36q8zrj74vrym5cypd",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [],
        blockHeight: 11139762,
        creationDate: "2023-04-19T14:28:31.000Z",
        operationsCount: 6,
        operations: [],
        pendingOperations: [],
        currencyId: "persistence",
        unitMagnitude: 6,
        lastSyncDate: "2023-04-26T14:01:03.106Z",
        balance: "4776304",
        spendableBalance: "4176304",
        balanceHistoryCache: {
          HOUR: {
            balances: [
              0, 5000000, 5000000, 5000000, 5000000, 5000000, 5000000, 5000000, 5000000, 5000000,
              5000000, 5000000, 5000000, 5000000, 5000000, 5000000, 5000000, 5000000, 5000000,
              5000000, 5000000, 5000000, 5000000, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
              4776304, 4776304, 4776304, 4776304, 4776304, 4776304,
            ],
            latestDate: 1682517600000,
          },
          DAY: {
            balances: [0, 5000000, 4776304, 4776304, 4776304, 4776304, 4776304, 4776304],
            latestDate: 1682460000000,
          },
          WEEK: { balances: [0, 4776304], latestDate: 1682200800000 },
        },
        xpub: "persistence1gyauvl44q2apn3u3aujm36q8zrj74vrym5cypd",
        swapHistory: [],
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "100000",
            recipient: "persistence1v2mp0m7k96dm9qv60fkspcqlzpkzrwnevf47z2",
            useAllAmount: false,
            family: "cosmos",
            mode: "send",
            networkInfo: null,
            fees: "2021",
            gas: "80829",
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
