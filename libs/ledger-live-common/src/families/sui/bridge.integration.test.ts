import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-sui/bridge/bridge.integration.test";

testBridge(dataset);
