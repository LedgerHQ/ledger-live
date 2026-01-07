import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import "../../../__tests__/test-helpers/setup.integration";
import axelar from "./axelar";
import type { Transaction } from "../types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    axelar,
  },
};

// FIXME: Disabled due to live validator token changes
describe.skip("axelar integration", () => {
  testBridge(dataset);
});
