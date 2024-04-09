import { dataset } from "@ledgerhq/coin-ton/bridge.integration.test";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup";

testBridge(dataset);
