import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { Transaction } from "./types";
import { DatasetTest } from "@ledgerhq/types-live";
import cosmos from "./datasets/cosmos";
import osmosis from "./datasets/osmosis";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    cosmos,
    osmosis,
  },
};

testBridge(dataset);
