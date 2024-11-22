import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import "../../../__tests__/test-helpers/setup";
import type { Transaction } from "../types";
import mantra from "./mantra";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    mantra,
  },
};

testBridge(dataset);
