import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import "../../../__tests__/test-helpers/setup.integration";
import desmos from "./desmos";
import type { Transaction } from "../types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    desmos,
  },
};

// FIXME: Disabled due to blockchain state changes causing snapshot mismatches
describe.skip("desmos integration", () => {
  testBridge(dataset);
});
