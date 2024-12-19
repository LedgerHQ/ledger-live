import { fromTransactionRaw } from "@ledgerhq/coin-cosmos/transaction";
import { CurrenciesData } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  FIXME_ignorePreloadFields: ["validators"],
  scanAccounts: [
    {
      name: "xion seed 1",
      apdus: `
      => 55040000190478696f6e2c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e8378696f6e3167796175766c3434713261706e33753361756a6d333671387a726a373476727968337934657a9000
      => 55040000190478696f6e2c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e8378696f6e3167796175766c3434713261706e33753361756a6d333671387a726a373476727968337934657a9000
      => 55040000190478696f6e2c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f78696f6e3176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e657176663036399000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops", "pendingOperations are cleaned up"],
      raw: {
        id: "js:2:xion:xion1gyauvl44q2apn3u3aujm36q8zrj74vryh3y4ez:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        xpub: "xion1gyauvl44q2apn3u3aujm36q8zrj74vryh3y4ez",
        freshAddress: "xion1gyauvl44q2apn3u3aujm36q8zrj74vryh3y4ez",
        freshAddressPath: "44'/118'/0'/0/0",
        name: "Xion 1",
        derivationMode: "",
        index: 0,
        currencyId: "xion",
        operationsCount: 2,
        operations: [],
        pendingOperations: [],
        lastSyncDate: "",
        balance: "676335",
        spendableBalance: "562180",
        blockHeight: 4486981,
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "10000",
            recipient: "xion108uy5q9jt59gwugq5yrdhkzcd9jryslmr32fql",
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
            amount: BigNumber("10000"),
          }),
        },
      ],
    },
  ],
};

export default dataset;
