import "../../__tests__/test-helpers/setup.integration";
import { REGULAR_CHAINS } from "./fixtures/deviceApdus";
import { describeLiveAccountBridge } from "./fixtures/liveAccountBridgeSuite";

describeLiveAccountBridge(REGULAR_CHAINS);
