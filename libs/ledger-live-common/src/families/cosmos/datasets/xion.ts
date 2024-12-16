import { fromTransactionRaw } from "@ledgerhq/coin-cosmos/transaction";
import { CurrenciesData } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  FIXME_ignorePreloadFields: ["validators"],
  // scanAccounts: [
  //   {
  //     name: "xion seed 1",
  //     apdus: `
  //       => 55040000190478696f6e2c00008076000080000000800000000000000000
  //       <= 0x0301a5bc0d94728a62db72b7e162add7767a58f10a5013543637694b2c4a66cc5078696f6e316738343933346a70753376356465357971756b6b6b68786d637673773375326173306b726d359000
  //       `,
  //   },
  // ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops", "pendingOperations are cleaned up"],
      raw: {
        id: "js:2:xion:xion1g84934jpu3v5de5yqukkkhxmcvsw3u2as0krm5:",
        seedIdentifier: "0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a",
        xpub: "xion1g84934jpu3v5de5yqukkkhxmcvsw3u2as0krm5",
        freshAddress: "xion1g84934jpu3v5de5yqukkkhxmcvsw3u2as0krm5",
        freshAddressPath: "44'/118'/0'/0/0",
        name: "Xion 1",
        derivationMode: "",
        index: 0,
        operationsCount: 3,
        operations: [],
        balance: "715838",
        spendableBalance: "715838",
        blockHeight: 4476555,
        pendingOperations: [],
        currencyId: "xion",
        lastSyncDate: "",
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
