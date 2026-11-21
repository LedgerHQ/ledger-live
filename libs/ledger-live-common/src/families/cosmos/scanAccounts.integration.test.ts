import "../../__tests__/test-helpers/setup.integration";
import { REGULAR_CHAINS } from "./fixtures/deviceApdus";
import { describeLiveScan } from "./fixtures/liveScanSuite";

describeLiveScan(REGULAR_CHAINS);
