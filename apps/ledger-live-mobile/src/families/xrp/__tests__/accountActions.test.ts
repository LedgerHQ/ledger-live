import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { NavigatorName, ScreenName } from "~/const";
import accountActions from "../accountActions";
import { XRP_ACCOUNT } from "../__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const getEnabledStandardsMock = jest.mocked(getXrpEnabledTokenStandards);

describe("xrp accountActions.getManageAssetsNavigation", () => {
  it("opens Manage assets on the account", () => {
    getEnabledStandardsMock.mockReturnValue(["iou", "mpt"]);

    expect(accountActions.getManageAssetsNavigation(XRP_ACCOUNT)).toEqual([
      NavigatorName.XrpManageTokenFlow,
      { screen: ScreenName.XrpManageTokenManage, params: { accountId: XRP_ACCOUNT.id } },
    ]);
  });

  it("stays available with a single standard on", () => {
    getEnabledStandardsMock.mockReturnValue(["mpt"]);

    expect(accountActions.getManageAssetsNavigation(XRP_ACCOUNT)).toBeDefined();
  });

  it("is hidden while no token standard is enabled", () => {
    getEnabledStandardsMock.mockReturnValue([]);

    expect(accountActions.getManageAssetsNavigation(XRP_ACCOUNT)).toBeUndefined();
  });
});
