import "../../__tests__/test-helpers/setup.integration";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-near/test/bridge.dataset";

// config_near_generic_bridge ships defaulting to false so the merge is inert for users, but the
// generic route is what this dataset covers, so CI exercises it the same way QA will enable it.
LiveConfig.setOverride("config_near_generic_bridge", true);

testBridge(dataset);
