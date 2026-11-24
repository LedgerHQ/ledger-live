import { act } from "react";
import invariant from "invariant";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { renderHook } from "tests/testSetup";
import AccountHeaderManageActions from "./AccountHeaderManageActions";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
} from "./__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: jest.fn(),
}));

const useManageActions = AccountHeaderManageActions;
invariant(useManageActions, "xrp: accountHeaderManageActions required");

describe("xrp AccountHeaderManageActions", () => {
  beforeEach(() => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
  });

  it("offers Manage on the XRP account, which opens the Manage assets dialog", () => {
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT] };

    const { result, store } = renderHook(() => {
      return useManageActions({ account, parentAccount: null });
    });

    expect(result.current).toEqual([expect.objectContaining({ label: "Manage" })]);

    act(() => {
      result.current?.[0].onClick();
    });

    expect(store.getState().dialogsWithData.FAMILY_DIALOG).toEqual({
      isOpen: true,
      data: { accountId: account.id, params: { screen: "manageAssets" } },
    });
  });

  it.each([
    ["holds no token", []],
    ["holds only a removed token", [XRP_REMOVED_TOKEN_ACCOUNT]],
  ])("offers nothing on an XRP account that %s", (_, subAccounts) => {
    const account = { ...XRP_ACCOUNT, subAccounts };

    const { result } = renderHook(() => {
      return useManageActions({ account, parentAccount: null });
    });

    expect(result.current).toEqual([]);
  });

  it("offers nothing on an XRP account whose tokens are of a disabled standard", () => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou"]);
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_MPT_TOKEN_ACCOUNT] };

    const { result } = renderHook(() => {
      return useManageActions({ account, parentAccount: null });
    });

    expect(result.current).toEqual([]);
  });

  it.each([
    ["an IOU", XRP_IOU_TOKEN_ACCOUNT],
    ["an MPT", XRP_MPT_TOKEN_ACCOUNT],
  ])("offers nothing on %s token account", (_, tokenAccount) => {
    const parentAccount = { ...XRP_ACCOUNT, subAccounts: [tokenAccount] };

    const { result } = renderHook(() => {
      return useManageActions({ account: tokenAccount, parentAccount });
    });

    expect(result.current).toEqual([]);
  });
});
