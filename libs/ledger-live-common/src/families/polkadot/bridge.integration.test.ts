import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-polkadot/__tests__/bridge.integration.test";

import "@ledgerhq/coin-polkadot/__tests__/bridge.integration.test";

testBridge(dataset);
