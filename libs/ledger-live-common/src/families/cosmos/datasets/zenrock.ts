import { fromTransactionRaw } from "@ledgerhq/coin-cosmos/transaction";
import { CurrenciesData } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  FIXME_ignorePreloadFields: ["validators"],
  scanAccounts: [
    {
      name: "zenrock seed 1",
      apdus: `
      => 5504000018037a656e2c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e837a656e3167796175766c3434713261706e33753361756a6d333671387a726a37347672793034766b72639000
      => 5504000018037a656e2c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e837a656e3167796175766c3434713261706e33753361756a6d333671387a726a37347672793034766b72639000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops", "pendingOperations are cleaned up"],
      raw: {
        id: "js:2:zenrock:zen1gyauvl44q2apn3u3aujm36q8zrj74vry04vkrc:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        freshAddress: "zen1gyauvl44q2apn3u3aujm36q8zrj74vry04vkrc",
        xpub: "zen1gyauvl44q2apn3u3aujm36q8zrj74vry04vkrc",
        freshAddressPath: "44'/118'/0'/0/0",
        derivationMode: "",
        index: 0,
        currencyId: "zenrock",
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        lastSyncDate: "",
        balance: "0",
        spendableBalance: "0",
        blockHeight: 431928,
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "10000",
            recipient: "zen1704dk997ccmk5x8smn8secphckfvbgxxfd99ssr",
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
