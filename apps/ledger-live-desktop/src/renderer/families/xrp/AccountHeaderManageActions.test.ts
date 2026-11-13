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

const hook = AccountHeaderManageActions;
invariant(hook, "xrp: accountHeaderManageActions required");

describe("xrp AccountHeaderManageActions", () => {
  beforeEach(() => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
  });

  it.each([
    ["Manage token", "MODAL_XRP_MANAGE_TOKEN", XRP_IOU_TOKEN_ACCOUNT],
    ["Remove token", "MODAL_XRP_REMOVE_TOKEN", XRP_MPT_TOKEN_ACCOUNT],
  ] as const)("offers only %s, which opens %s", (label, modal, tokenAccount) => {
    const { result, store } = renderHook(() =>
      hook({ account: tokenAccount, parentAccount: XRP_ACCOUNT }),
    );

    expect(result.current).toEqual([expect.objectContaining({ label })]);

    act(() => {
      result.current?.[0].onClick();
    });

    expect(store.getState().modals[modal]).toEqual({
      isOpened: true,
      data: { account: XRP_ACCOUNT, tokenAccount },
    });
  });

  it("disables Manage token on a removed token", () => {
    const { result } = renderHook(() =>
      hook({ account: XRP_REMOVED_TOKEN_ACCOUNT, parentAccount: XRP_ACCOUNT }),
    );

    expect(result.current).toEqual([expect.objectContaining({ disabled: true })]);
  });

  it("offers nothing on the XRP account itself", () => {
    const { result } = renderHook(() => hook({ account: XRP_ACCOUNT, parentAccount: null }));

    expect(result.current).toEqual([]);
  });

  it("offers nothing when no token standard is enabled", () => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue([]);

    const { result } = renderHook(() =>
      hook({ account: XRP_IOU_TOKEN_ACCOUNT, parentAccount: XRP_ACCOUNT }),
    );

    expect(result.current).toEqual([]);
  });
});
