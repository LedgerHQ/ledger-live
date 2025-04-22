import "../../__tests__/test-helpers/setup";
jest.mock("blockies-ts", () => ({
  create: jest.fn(() => ({
    toDataURL: () => "data:image/png;base64,fakebase64string",
  })),
}));

import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-aptos/test/index";

testBridge(dataset);
