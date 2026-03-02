import type { DatasetTest } from "@ledgerhq/types-live";
import celo from "../datasets/celo.scanAccounts.1";
import type { Transaction } from "../types";

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    celo,
  },
};
