import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-polkadot/lib/bridge.integration.test";

import "@ledgerhq/coin-polkadot/lib/bridge.integration.test";

testBridge(dataset);
