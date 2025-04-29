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
      <= 0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a62626e316738343933346a70753376356465357971756b6b6b68786d6376737733753261396361736a789000
      => 55040000180362626e2c00008076000080000000800000000000000000
      <= 0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a62626e316738343933346a70753376356465357971756b6b6b68786d6376737733753261396361736a789000
      => 55040000180362626e2c00008076000080010000800000000000000000
      <= 02624ac83690d5ef627927104767d679aef73d3d3c9544abe4206b1d0c463c94ff62626e31303875793571396a743539677775677135797264686b7a6364396a7279736c6d6b78703666649000
      => 55040000180362626e2c00008076000080020000800000000000000000
      <= 038ff98278402aa3e46ccfd020561dc9724ab63d7179ca507c8154b5257c7d520062626e3163676336393661793270673664346763656a656b3279386c6136366a37653579787830386d689000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops", "pendingOperations are cleaned up"],
      raw: {
        id: "js:2:babylon:bbn1g84934jpu3v5de5yqukkkhxmcvsw3u2a9casjx:",
        seedIdentifier: "0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a",
        xpub: "bbn1g84934jpu3v5de5yqukkkhxmcvsw3u2a9casjx",
        derivationMode: "",
        index: 0,
        freshAddress: "bbn1g84934jpu3v5de5yqukkkhxmcvsw3u2a9casjx",
        freshAddressPath: "44'/118'/0'/0/0",
        name: "Babylon 1 - Nano X",
        blockHeight: 71848,
        balance: "40699912",
        spendableBalance: "40699912",
        operations: [],
        operationsCount: 2,
        pendingOperations: [],
        currencyId: "babylon",
        lastSyncDate: "",
        creationDate: "2025-04-10T15:47:19.000Z",
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "1000000",
            recipient: "bbn1vh34djka7ug2gww9njrsmmr7emj3dx3paz5sj4",
            useAllAmount: false,
            family: "cosmos",
            mode: "send",
            networkInfo: null,
            fees: "213",
            gas: "106317",
            validators: [],
            memo: "",
            sourceValidator: "",
          }),
          expectedStatus: () => ({
            errors: {},
            warnings: {},
            amount: BigNumber("1000000"),
          }),
        },
      ],
    },
  ],
};

export default dataset;
