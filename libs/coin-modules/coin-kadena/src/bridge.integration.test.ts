import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { BigNumber } from "bignumber.js";

const PUBKEY = "15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e";

const kadena: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "kadena seed 1",
      apdus: `
      => 0002000015052c00008072020080000000800000000000000000
      <= 2015daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e9000
      => 0002000015052c00008072020080010000800000000000000000
      <= 20ced7b6fcaf2421b294f431965374d43e3b97352131609162d6c78325ad6090159000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:kadena:15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e:`,
        seedIdentifier: PUBKEY,
        name: "Kadena 1",
        derivationMode: "",
        index: 0,
        xpub: "15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e",
        freshAddress: "k:15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e",
        freshAddressPath: "44'/626'/0'/0/0'",
        blockHeight: 4333588,
        operations: [],
        pendingOperations: [],
        currencyId: "kadena",
        lastSyncDate: "",
        balance: "20", // we have 20 KDA
      },
      transactions: [
        // HERE WE WILL INSERT OUR test
        {
          name: "Same as Recipient",
          transaction: t => ({
            ...t,
            amount: new BigNumber(20),
            recipient: "k:15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
      ],
    }
  ]
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    kadena,
  },
};