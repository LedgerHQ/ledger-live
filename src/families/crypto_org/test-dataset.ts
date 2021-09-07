import type { DatasetTest } from "../../types";
import type { Transaction } from "./types";
// import crypto_org_croeseid from "./datasets/croeseid";

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    // TODO a QA need to restore this testing (if it's still up?)
    // crypto_org_croeseid,
  },
};

export default dataset;
