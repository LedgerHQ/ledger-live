import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-algorand/bridge.integration.test";

// FIXME: why is this needed? cf. polkadot
import "@ledgerhq/coin-algorand/bridge.integration.test";

testBridge(dataset);
