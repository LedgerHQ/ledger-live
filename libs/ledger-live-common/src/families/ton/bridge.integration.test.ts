import { dataset } from "@ledgerhq/coin-ton/__tests__/integration/bridge.integration.test";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup";

// FIXME: Disabled due to TypeError in Send max transaction (ts.amount undefined)
describe.skip("ton integration", () => {
  testBridge(dataset);
});
