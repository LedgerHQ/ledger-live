import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { Transaction } from "./types";
import crypto_org_croeseid from "./datasets/croeseid";
import type { DatasetTest } from "@ledgerhq/types-live";

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    crypto_org_croeseid,
  },
};

testBridge(dataset);
