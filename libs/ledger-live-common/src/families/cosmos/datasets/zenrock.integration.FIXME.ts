import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import "../../../__tests__/test-helpers/setup.integration";
import type { Transaction } from "../types";
import zenrock from "./zenrock";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    zenrock,
  },
};

testBridge(dataset);
