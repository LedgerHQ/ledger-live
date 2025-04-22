import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-aptos/test/index";

jest.mock("blockies-ts", () => ({
  create: jest.fn(() => ({
    toDataURL: () => "data:image/png;base64,fakebase64string",
  })),
}));

testBridge(dataset);
