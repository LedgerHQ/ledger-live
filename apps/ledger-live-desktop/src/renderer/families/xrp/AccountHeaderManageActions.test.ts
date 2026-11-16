import { act } from "react";
import invariant from "invariant";
import type { Operation } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { renderHook } from "tests/testSetup";
import AccountHeaderManageActions from "./AccountHeaderManageActions";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "./__mocks__/account.mock";
import { xrpMptToken } from "./__mocks__/currency.mock";

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

  it.each([
    [
      "Manage token",
      "MODAL_XRP_MANAGE_TOKEN",
      { account: XRP_ACCOUNT, tokenAccount: XRP_IOU_TOKEN_ACCOUNT },
    ],
    [
      "Remove token",
      "MODAL_XRP_ADD_TOKEN",
      {
        account: XRP_ACCOUNT,
        tokenAccount: XRP_MPT_TOKEN_ACCOUNT,
        remove: true,
      },
    ],
  ] as const)("offers only %s, which opens %s", (label, modal, data) => {
    const { result, store } = renderHook(() => {
      return useManageActions({ account: data.tokenAccount, parentAccount: XRP_ACCOUNT });
    });

    expect(result.current).toEqual([expect.objectContaining({ label })]);

    act(() => {
      result.current?.[0].onClick();
    });

    expect(store.getState().modals[modal]).toEqual({ isOpened: true, data });
  });

  it("disables Manage token on a removed token", () => {
    const { result } = renderHook(() => {
      return useManageActions({ account: XRP_REMOVED_TOKEN_ACCOUNT, parentAccount: XRP_ACCOUNT });
    });

    expect(result.current).toEqual([expect.objectContaining({ disabled: true })]);
  });

  it("keeps Manage token on a frozen IOU, for its settings", () => {
    const frozenIouAccount = makeXrpTokenAccount({ isLocked: true });

    const { result } = renderHook(() => {
      return useManageActions({ account: frozenIouAccount, parentAccount: XRP_ACCOUNT });
    });

    expect(result.current).toEqual([expect.objectContaining({ disabled: false })]);
  });

  it("disables Remove token on a frozen token, and says why", () => {
    const frozenMptAccount = { ...XRP_MPT_TOKEN_ACCOUNT, xrpResources: { isLocked: true } };

    const { result } = renderHook(() => {
      return useManageActions({ account: frozenMptAccount, parentAccount: XRP_ACCOUNT });
    });

    expect(result.current).toEqual([
      expect.objectContaining({ disabled: true, tooltip: "This token is frozen" }),
    ]);
  });

  it("disables Remove token while its removal is pending, and says why", () => {
    const removal = {
      type: "OPT_OUT",
      transactionRaw: {
        assetReference: xrpMptToken.tokenIdentifier,
        assetOwner: xrpMptToken.contractAddress,
      },
    } as unknown as Operation;
    const parentAccount = { ...XRP_ACCOUNT, pendingOperations: [removal] };

    const { result } = renderHook(() => {
      return useManageActions({ account: XRP_MPT_TOKEN_ACCOUNT, parentAccount });
    });

    expect(result.current).toEqual([
      expect.objectContaining({ disabled: true, tooltip: "Removal pending" }),
    ]);
  });

  it("offers Manage assets on the XRP account, which opens the dialog", () => {
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT] };

    const { result, store } = renderHook(() => {
      return useManageActions({ account, parentAccount: null });
    });

    expect(result.current).toEqual([expect.objectContaining({ label: "Manage assets" })]);

    act(() => {
      result.current?.[0].onClick();
    });

    expect(store.getState().dialogs.XRP_MANAGE_ASSETS).toBe(true);
  });

  it("offers nothing on an XRP account that holds no token", () => {
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_REMOVED_TOKEN_ACCOUNT] };

    const { result } = renderHook(() => {
      return useManageActions({ account, parentAccount: null });
    });

    expect(result.current).toEqual([]);
  });

  it("offers nothing when no token standard is enabled", () => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue([]);

    const { result } = renderHook(() => {
      return useManageActions({ account: XRP_IOU_TOKEN_ACCOUNT, parentAccount: XRP_ACCOUNT });
    });

    expect(result.current).toEqual([]);
  });
});
