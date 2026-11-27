import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { NavigatorName, ScreenName } from "~/const";
import manageAssetsAction from "../manageAssetsAction";
import { XRP_ACCOUNT, XRP_ACCOUNT_WITH_TOKEN } from "../__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const getEnabledStandardsMock = jest.mocked(getXrpEnabledTokenStandards);

describe("xrp manageAssetsAction", () => {
  beforeEach(() => {
    getEnabledStandardsMock.mockReturnValue(["iou", "mpt"]);
  });

  it("can manage an account holding a token", () => {
    expect(manageAssetsAction.canManage(XRP_ACCOUNT_WITH_TOKEN)).toBe(true);
  });

  it("cannot manage an account without tokens", () => {
    expect(manageAssetsAction.canManage(XRP_ACCOUNT)).toBe(false);
  });

  it("opens the Manage assets list of the account", () => {
    const navigation = { navigate: jest.fn() };

    manageAssetsAction.open({
      account: XRP_ACCOUNT_WITH_TOKEN,
      navigation: navigation as never,
    });

    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.XrpManageTokenFlow, {
      screen: ScreenName.XrpManageTokenList,
      params: { accountId: XRP_ACCOUNT_WITH_TOKEN.id },
    });
  });
});
