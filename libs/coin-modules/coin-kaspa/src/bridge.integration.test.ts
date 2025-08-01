import { DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    kaspa: {},
  },
};
