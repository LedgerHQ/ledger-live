import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import "../../../__tests__/test-helpers/setup";
import type { Transaction } from "../types";
import xion from "./xion";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    xion,
  },
};

testBridge(dataset);
