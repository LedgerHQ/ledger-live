import "../../__tests__/test-helpers/setup.integration";
import { WEEKLY_CHAINS } from "./fixtures/deviceApdus";
import {
  describeCosmosHubAccountBridgeHistory,
  describeLiveAccountBridge,
} from "./fixtures/liveAccountBridgeSuite";

describeLiveAccountBridge(WEEKLY_CHAINS);
describeCosmosHubAccountBridgeHistory();
