import type { DatasetTest } from "../../types";
import type { Transaction } from "./types";
import crypto_org_croeseid from "./datasets/croeseid";

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    crypto_org_croeseid,
  },
};

export default dataset;
