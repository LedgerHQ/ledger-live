import { dataset } from "@ledgerhq/coin-ton/test/bridge.dataset";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup.integration";

// FIXME: Disabled due to TypeError in Send max transaction (ts.amount undefined)
describe.skip("ton integration", () => {
  testBridge(dataset);
});
