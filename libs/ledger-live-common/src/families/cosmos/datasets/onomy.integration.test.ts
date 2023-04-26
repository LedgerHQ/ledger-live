import "../../../__tests__/test-helpers/setup";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import type { Transaction } from "../types";
import { DatasetTest } from "@ledgerhq/types-live";
import quicksilver from "./quicksilver";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    quicksilver,
  },
};

testBridge(dataset);
