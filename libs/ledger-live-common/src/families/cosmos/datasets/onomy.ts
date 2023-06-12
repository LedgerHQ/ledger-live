import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import BigNumber from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources"],
  scanAccounts: [
    {
      name: "onomy seed 1",
      apdus: `
      => 550400001a056f6e6f6d792c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836f6e6f6d793167796175766c3434713261706e33753361756a6d333671387a726a37347672793065327037769000
      => 550400001a056f6e6f6d792c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836f6e6f6d793167796175766c3434713261706e33753361756a6d333671387a726a37347672793065327037769000
      => 550400001a056f6e6f6d792c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f6f6e6f6d793176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e656379386d61749000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:onomy:onomy1gyauvl44q2apn3u3aujm36q8zrj74vry0e2p7v:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Onomy 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "onomy1gyauvl44q2apn3u3aujm36q8zrj74vry0e2p7v",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [],
        blockHeight: 2142712,
        creationDate: "2023-04-24T09:46:36.000Z",
        operationsCount: 4,
        operations: [],
        pendingOperations: [],
        currencyId: "onomy",
        unitMagnitude: 18,
        lastSyncDate: "2023-04-26T14:37:50.539Z",
        balance: "5006237953263518010",
        spendableBalance: "3806237953263518010",
        balanceHistoryCache: {
          HOUR: {
            balances: [
              6237953263519456, 5006237953263520000, 5006237953263520000, 5006237953263520000,
              5006237953263520000, 5006237953263520000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000, 5006237953263519000, 5006237953263519000,
              5006237953263519000, 5006237953263519000,
            ],
            latestDate: 1682517600000,
          },
          DAY: {
            balances: [6237953263519456, 5006237953263519000, 5006237953263519000],
            latestDate: 1682460000000,
          },
          WEEK: { balances: [6237953263519456], latestDate: 1682200800000 },
        },
        xpub: "onomy1gyauvl44q2apn3u3aujm36q8zrj74vry0e2p7v",
        swapHistory: [],
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "100000000000000000",
            recipient: "onomy1v2mp0m7k96dm9qv60fkspcqlzpkzrwnecy8mat",
            useAllAmount: false,
            family: "cosmos",
            mode: "send",
            networkInfo: null,
            fees: "209",
            gas: "83525",
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
