import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "@ledgerhq/coin-cosmos/transaction";
import { BigNumber } from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  FIXME_ignorePreloadFields: ["validators"], // the APY of validators changes over time
  scanAccounts: [
    {
      name: "babylon seed 1",
      apdus: `
      => 55040000180362626e2c00008076000080000000800000000000000000
      <= 03cd9e27aa78eddce3fda5f8050db35196b188d80d10bd04aab15e5669defee8b062626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e9000
      => 55040000180362626e2c00008076000080000000800000000000000000
      <= 03cd9e27aa78eddce3fda5f8050db35196b188d80d10bd04aab15e5669defee8b062626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e9000
      => 55040000180362626e2c00008076000080010000800000000000000000
      <= 02b3c7368432b998240a2806eb08a00becd359867ca9cdc94f3eb4ba29a6eb0d7a62626e316a7932387a6e6c6b7034783767663863786c6a366e326e676b726b78683279793774326d39799000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops", "pendingOperations are cleaned up"],
      raw: {
        id: "js:2:babylon:bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n:",
        seedIdentifier: "03cd9e27aa78eddce3fda5f8050db35196b188d80d10bd04aab15e5669defee8b0",
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
        freshAddressPath: "44'/118'/0'/0/0",
        blockHeight: 207592,
        creationDate: "2025-05-02T10:23:08.000Z",
        operationsCount: 1,
        operations: [],
        pendingOperations: [],
        currencyId: "babylon",
        lastSyncDate: "2025-05-02T10:24:44.245Z",
        balance: "1000000",
        spendableBalance: "1000000",
        balanceHistoryCache: {
          HOUR: { balances: [0], latestDate: 1746180000000 },
          DAY: { balances: [0], latestDate: 1746136800000 },
          WEEK: { balances: [0], latestDate: 1745704800000 },
        },
        xpub: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
        swapHistory: [],
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "1000",
            recipient: "bbn1vh34djka7ug2gww9njrsmmr7emj3dx3paz5sj4",
            useAllAmount: false,
            family: "cosmos",
            mode: "send",
            networkInfo: null,
            fees: "238",
            gas: "118993",
            validators: [],
            memo: "",
            sourceValidator: "",
          }),
          expectedStatus: () => ({
            errors: {},
            warnings: {},
            amount: BigNumber("1000"),
          }),
        },
      ],
    },
  ],
};

export default dataset;
