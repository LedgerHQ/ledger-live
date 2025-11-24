import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

const aleo: CurrenciesData<Transaction> = {
  scanAccounts: [],
  accounts: [],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    aleo,
  },
};
