import "../../__tests__/test-helpers/setup.integration";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-mina/test/index";

// FIXME: Disabled due to blockchain state changes causing sync operation mismatches
describe.skip("mina integration", () => {
  testBridge(dataset);
});
