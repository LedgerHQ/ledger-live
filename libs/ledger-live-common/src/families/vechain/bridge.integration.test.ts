import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import dataset from "@ledgerhq/coin-vechain/bridge.integration.test";
import { DatasetTest } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/coin-vechain/lib/types";

testBridge(dataset as DatasetTest<Transaction>); // TODO: Remove casting
