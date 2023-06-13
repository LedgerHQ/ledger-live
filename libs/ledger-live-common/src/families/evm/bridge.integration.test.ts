import { dataset } from "@ledgerhq/coin-evm/bridge.integration.test";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup";

import "@ledgerhq/coin-evm/bridge.integration.test";

testBridge(dataset);
