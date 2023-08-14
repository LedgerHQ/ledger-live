import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import BigNumber from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "quicksilver seed 1",
      apdus: `
      => 550400001a05717569636b2c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83717569636b3167796175766c3434713261706e33753361756a6d333671387a726a3734767279377577396b6d9000
      => 550400001a05717569636b2c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83717569636b3167796175766c3434713261706e33753361756a6d333671387a726a3734767279377577396b6d9000
      => 550400001a05717569636b2c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f717569636b3176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e656670726c34759000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:quicksilver:quick1gyauvl44q2apn3u3aujm36q8zrj74vry7uw9km:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Quicksilver 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "quick1gyauvl44q2apn3u3aujm36q8zrj74vry7uw9km",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [],
        blockHeight: 1643358,
        creationDate: "2023-04-19T14:39:33.000Z",
        operationsCount: 3,
        operations: [],
        pendingOperations: [],
        currencyId: "quicksilver",
        unitMagnitude: 6,
        lastSyncDate: "2023-04-25T15:22:47.450Z",
        balance: "9998269",
        spendableBalance: "8998269",
        balanceHistoryCache: {
          HOUR: {
            balances: [],
            latestDate: 1682434800000,
          },
          DAY: {
            balances: [0, 9999750, 9998269, 9998269, 9998269, 9998269, 9998269],
            latestDate: 1682373600000,
          },
          WEEK: { balances: [0, 9998269], latestDate: 1682200800000 },
        },
        xpub: "quick1gyauvl44q2apn3u3aujm36q8zrj74vry7uw9km",
        swapHistory: [],
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "100000",
            recipient: "quick1v2mp0m7k96dm9qv60fkspcqlzpkzrwnefprl4u",
            useAllAmount: false,
            family: "cosmos",
            mode: "send",
            networkInfo: null,
            fees: "264",
            gas: "105209",
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
