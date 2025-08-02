import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "../../../__tests__/test-helpers/bridge";
import "../../../__tests__/test-helpers/setup";
import babylon from "./terra";
import type { Transaction } from "../types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
        uluna,
        uusd,
        ukrw,
        LUNC,
        USTC,
        KRT,
  },
};

testBridge(dataset);
