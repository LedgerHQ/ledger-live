import { dataset } from "@ledgerhq/coin-evm/test/bridge.dataset";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup.integration";

testBridge(dataset);
