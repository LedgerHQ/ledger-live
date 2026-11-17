import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { NavigatorName, ScreenName } from "~/const";
import accountActions from "../accountActions";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
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
    expect(action.navigationParams).toEqual([
      NavigatorName.XrpManageTokenFlow,
      {
        screen: ScreenName.XrpManageTokenManage,
        params: { accountId: XRP_ACCOUNT_WITH_TOKEN.id },
      },
    ]);
  });

  it("shows Manage on an account holding only an MPT token", () => {
    const actions = accountActions.getMainActions({
      account: { ...XRP_ACCOUNT, subAccounts: [XRP_MPT_TOKEN_ACCOUNT] },
    });

    expect(actions).toHaveLength(1);
  });

  it("shows nothing on an account without tokens", () => {
    expect(accountActions.getMainActions({ account: XRP_ACCOUNT })).toEqual([]);
  });

  it("shows nothing when the only token was removed", () => {
    const actions = accountActions.getMainActions({
      account: { ...XRP_ACCOUNT, subAccounts: [XRP_REMOVED_TOKEN_ACCOUNT] },
    });

    expect(actions).toEqual([]);
  });

  it("shows nothing while no token standard is enabled", () => {
    getEnabledStandardsMock.mockReturnValue([]);

    expect(accountActions.getMainActions({ account: XRP_ACCOUNT_WITH_TOKEN })).toEqual([]);
  });

  it("shows nothing while the standard of the token is off", () => {
    getEnabledStandardsMock.mockReturnValue(["mpt"]);

    expect(accountActions.getMainActions({ account: XRP_ACCOUNT_WITH_TOKEN })).toEqual([]);
  });

  it("shows nothing on a token account", () => {
    expect(accountActions.getMainActions({ account: XRP_IOU_TOKEN_ACCOUNT })).toEqual([]);
  });
});
