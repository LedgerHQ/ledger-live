import "../../__tests__/test-helpers/setup.integration";
import { WEEKLY_CHAINS } from "./fixtures/deviceApdus";
import { describeCosmosHubScanHistory, describeLiveScan } from "./fixtures/liveScanSuite";

describeLiveScan(WEEKLY_CHAINS);
describeCosmosHubScanHistory();
