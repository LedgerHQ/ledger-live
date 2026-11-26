import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { getXrpResources, isFrozenToken } from "./utils";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "./__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: jest.fn(() => ["iou", "mpt"]),
}));

const frozenAccount = makeXrpTokenAccount({ isLocked: true });

describe("isFrozenToken", () => {
  it("is true for a locked token", () => {
    expect(isFrozenToken(frozenAccount, XRP_ACCOUNT)).toBe(true);
  });

  it("is false for an unlocked or removed token", () => {
    expect(isFrozenToken(XRP_IOU_TOKEN_ACCOUNT, XRP_ACCOUNT)).toBe(false);
    expect(isFrozenToken(XRP_REMOVED_TOKEN_ACCOUNT, XRP_ACCOUNT)).toBe(false);
  });

  it("is false for the XRP account", () => {
    expect(isFrozenToken(XRP_ACCOUNT, null)).toBe(false);
  });

  it("is false when no token standard is enabled", () => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValueOnce([]);

    expect(isFrozenToken(frozenAccount, XRP_ACCOUNT)).toBe(false);
  });
});

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
