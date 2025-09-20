import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-celo/test/bridgeDatasetTest";

// FIXME: Disabled due to obsolete APDU data and gas estimation issues
describe.skip("celo integration", () => {
  testBridge(dataset);
});
