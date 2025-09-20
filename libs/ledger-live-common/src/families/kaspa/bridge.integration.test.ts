import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-kaspa/test/index";

// FIXME: Disabled due to live blockchain data changes (blockHash)
describe.skip("kaspa integration", () => {
  testBridge(dataset);
});
