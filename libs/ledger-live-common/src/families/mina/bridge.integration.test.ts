import "../../__tests__/test-helpers/setup.integration";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-mina/test/index";

// FIXME: Disabled due to persistent 502 errors from Mina backend (Rosetta POST endpoints have no retry in live-network)
describe.skip("mina integration", () => {
  testBridge(dataset);
});
