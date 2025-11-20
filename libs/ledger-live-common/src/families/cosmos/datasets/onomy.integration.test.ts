import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import "../../../__tests__/test-helpers/setup.integration";
import onomy from "./onomy";
import type { Transaction } from "../types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    onomy,
  },
};

// FIXME: Disabled due to Jest worker exceptions (circular structure JSON)
describe.skip("onomy integration", () => {
  testBridge(dataset);
});
