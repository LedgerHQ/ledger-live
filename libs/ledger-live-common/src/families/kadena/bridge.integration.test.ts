import { dataset } from "@ledgerhq/coin-kadena/__tests__/integration/bridge.integration.test";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup";

testBridge(dataset);
