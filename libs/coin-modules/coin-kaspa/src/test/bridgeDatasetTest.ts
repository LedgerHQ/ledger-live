import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { Transaction } from "../types";

const kaspa: CurrenciesData<Transaction> = {};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    kaspa,
  },
};
