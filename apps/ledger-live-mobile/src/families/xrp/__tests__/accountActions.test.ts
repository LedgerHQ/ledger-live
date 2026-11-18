import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { NavigatorName, ScreenName } from "~/const";
import accountActions from "../accountActions";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
} from "../__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const getEnabledStandardsMock = jest.mocked(getXrpEnabledTokenStandards);

describe("xrp accountActions.getMainActions", () => {
  beforeEach(() => {
    getEnabledStandardsMock.mockReturnValue(["iou", "mpt"]);
  });

  it("opens Manage assets from an XRP account holding a token", () => {
    const [action] = accountActions.getMainActions({ account: XRP_ACCOUNT_WITH_TOKEN });

    expect(action.id).toBe("manage_token");
    // FabActions tracks button_clicked from the id: an event of its own would count each tap twice
    expect(action).not.toHaveProperty("event");
    expect(action.navigationParams).toEqual([
      NavigatorName.XrpManageTokenFlow,
      {
        screen: ScreenName.XrpManageTokenList,
        params: { accountId: XRP_ACCOUNT_WITH_TOKEN.id },
      },
    ]);
  });

  it("shows Manage on an account holding only an MPT token", () => {
    const actions = accountActions.getMainActions({
      account: { ...XRP_ACCOUNT, subAccounts: [XRP_MPT_TOKEN_ACCOUNT] },
    });

    expect(actions).toEqual([expect.objectContaining({ id: "manage_token" })]);
  });

  it("shows nothing on an account without tokens", () => {
    expect(accountActions.getMainActions({ account: XRP_ACCOUNT })).toEqual([]);
  });

  it("shows nothing on a token account", () => {
    expect(accountActions.getMainActions({ account: XRP_IOU_TOKEN_ACCOUNT })).toEqual([]);
  });
});
