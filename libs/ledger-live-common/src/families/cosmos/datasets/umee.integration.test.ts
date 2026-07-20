import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import "../../../__tests__/test-helpers/setup.integration";
import umee from "./umee";
import type { Transaction } from "../types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    umee,
  },
};

// FIXME: Disabled — dead LCD endpoint (getaddrinfo ENOTFOUND umee-api.polkachu.com).
// Umee never shipped in prod (currencyUmee flag never enabled 3+ yrs); pending full removal.
describe.skip("umee integration", () => {
  testBridge(dataset);
});
