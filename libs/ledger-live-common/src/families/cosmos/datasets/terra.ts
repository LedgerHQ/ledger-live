import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "@ledgerhq/coin-cosmos/transaction";
import { BigNumber } from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  FIXME_ignorePreloadFields: ["validators"], // the APY of validators changes over time
  scanAccounts: [
    {
      name: "terra seed 1",
      apdus: `
      => 550400001A0574657272612C0000804A010080000000800000000000000000
      <= [response for account 0]
      => 550400001A0574657272612C0000804A010080000000800000000000000000
      <= [response for account 0]
      => 550400001A0574657272612C0000804A010080010000800000000000000000
      <= [response for account 1]
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops", "pendingOperations are cleaned up"],
      raw: {
        id: "js:2:terra:terra1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n:",
        seedIdentifier: "[placeholder]",
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "terra1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
        freshAddressPath: "44'/330'/0'/0/0",
        blockHeight: 123456,
        creationDate: "2025-05-02T10:23:08.000Z",
        operationsCount: 1,
        operations: [],
        pendingOperations: [],
        currencyId: "terra",
        lastSyncDate: "2025-05-02T10:24:44.245Z",
        balance: "1000000",
        spendableBalance: "1000000",
        balanceHistoryCache: {
          HOUR: { balances: [0], latestDate: 1746180000000 },
          DAY: { balances: [0], latestDate: 1746136800000 },
          WEEK: { balances: [0], latestDate: 1745704800000 },
        },
        xpub: "terra1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
        swapHistory: [],
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "1000",
            recipient: "terra14lxhx09fyemu9lw46c9m9jk63cg6u8wdc8pdu4",
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
