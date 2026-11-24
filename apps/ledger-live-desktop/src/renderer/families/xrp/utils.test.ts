import { getXrpResources } from "./utils";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
} from "./__mocks__/account.mock";

describe("getXrpResources", () => {
  it("reads the resources of a held token", () => {
    expect(getXrpResources(XRP_IOU_TOKEN_ACCOUNT)).toBe(XRP_IOU_TOKEN_ACCOUNT.xrpResources);
  });

  it("has none for a removed token", () => {
    expect(getXrpResources(XRP_REMOVED_TOKEN_ACCOUNT)).toBeUndefined();
  });

  it("has none for the XRP account or no account", () => {
    expect(getXrpResources(XRP_ACCOUNT)).toBeUndefined();
    expect(getXrpResources(undefined)).toBeUndefined();
  });
});
