import { fromTransactionRaw } from "@ledgerhq/coin-cosmos/transaction";
import { CurrenciesData } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  FIXME_ignorePreloadFields: ["validators"], // the APY of validators changes over time
  scanAccounts: [
    {
      name: "mantra seed 1",
      apdus: `
        => 550400001b066d616e7472612c00008076000080000000800000000000000000
        <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836d616e7472613167796175766c3434713261706e33753361756a6d333671387a726a3734767279376e356e766e9000
        => 550400001b066d616e7472612c00008076000080000000800000000000000000
        <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836d616e7472613167796175766c3434713261706e33753361756a6d333671387a726a3734767279376e356e766e9000
        => 550400001b066d616e7472612c00008076000080010000800000000000000000
        <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f6d616e7472613176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e656677656630359000
          `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops", "pendingOperations are cleaned up"],
      raw: {
        id: "js:2:mantra:mantra1gyauvl44q2apn3u3aujm36q8zrj74vry7n5nvn:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        xpub: "mantra1gyauvl44q2apn3u3aujm36q8zrj74vry7n5nvn",
        derivationMode: "",
        index: 0,
        freshAddress: "mantra1gyauvl44q2apn3u3aujm36q8zrj74vry7n5nvn",
        freshAddressPath: "44'/118'/0'/0/0",
        name: "Mantra 1 - Nano X",
        blockHeight: 446179,
        balance: "715363",
        spendableBalance: "215363",
        operations: [],
        operationsCount: 5,
        pendingOperations: [],
        currencyId: "mantra",
        lastSyncDate: "",
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "10000",
            recipient: "mantra108uy5q9jt59gwugq5yrdhkzcd9jryslm2n604w",
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
