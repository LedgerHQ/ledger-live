import { dataset } from "@ledgerhq/coin-internet_computer/test/index";
import "../../__tests__/test-helpers/setup.integration";
import { testBridge } from "../../__tests__/test-helpers/bridge";

testBridge(dataset);
