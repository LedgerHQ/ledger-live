import "../../../__tests__/test-helpers/setup";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import type { Transaction } from "../types";
import { DatasetTest } from "@ledgerhq/types-live";
import desmos from "./desmos";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    desmos,
  },
};

testBridge(dataset);
