import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { DatasetTest } from "../../types";
import celo from "./datasets/celo.scanAccounts.1";
import type { Transaction } from "./types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    celo,
  },
};

testBridge(dataset);
