import "../../__tests__/test-helpers/setup";

import { dataset } from "@ledgerhq/coin-canton/test/index";
import { testBridge } from "../../__tests__/test-helpers/bridge";

testBridge(dataset);
