import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { Transaction } from "./types";
import { DatasetTest } from "@ledgerhq/types-live";
import cosmos from "./datasets/cosmos";
import osmosis from "./datasets/osmosis";
import axelar from "./datasets/axelar";
import onomy from "./datasets/onomy";
import quicksilver from "./datasets/quicksilver";
import persistence from "./datasets/persistence";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    axelar,
    onomy,
    quicksilver,
    persistence,
    cosmos,
    osmosis,
  },
};

testBridge(dataset);
