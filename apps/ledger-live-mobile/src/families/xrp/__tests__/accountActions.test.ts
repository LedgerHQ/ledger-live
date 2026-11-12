import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { NavigatorName, ScreenName } from "~/const";
import accountActions from "../accountActions";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_TOKEN_ACCOUNT,
} from "../__mocks__/account.mock";
import { xrpMptToken } from "../__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const getEnabledStandardsMock = jest.mocked(getXrpEnabledTokenStandards);

const MPT_TOKEN_ACCOUNT: TokenAccount = genTokenAccount(1, XRP_ACCOUNT, xrpMptToken);

describe("xrp accountActions.getMainActions", () => {
  beforeEach(() => {
    getEnabledStandardsMock.mockReturnValue(["iou", "mpt"]);
  });

  it("opens Manage token on an IOU token account", () => {
    const [action] = accountActions.getMainActions({
      account: XRP_IOU_TOKEN_ACCOUNT,
      parentAccount: XRP_ACCOUNT_WITH_TOKEN,
    });

    expect(action.id).toBe("manage_token");
    expect(action.navigationParams).toEqual([
      NavigatorName.XrpManageTokenFlow,
      {
        screen: ScreenName.XrpManageTokenManage,
        params: { accountId: XRP_IOU_TOKEN_ACCOUNT.id, parentId: XRP_ACCOUNT_WITH_TOKEN.id },
      },
    ]);
  });

  it("shows Manage token on an empty IOU token account", () => {
    const emptyTokenAccount = { ...XRP_IOU_TOKEN_ACCOUNT, balance: new BigNumber(0) };

    const actions = accountActions.getMainActions({
      account: emptyTokenAccount,
      parentAccount: XRP_ACCOUNT_WITH_TOKEN,
    });

    expect(actions).toHaveLength(1);
  });

  it("shows nothing on an MPT token account", () => {
    const actions = accountActions.getMainActions({
      account: MPT_TOKEN_ACCOUNT,
      parentAccount: XRP_ACCOUNT_WITH_TOKEN,
    });

    expect(actions).toEqual([]);
  });

  it("shows nothing while the IOU standard is off", () => {
    getEnabledStandardsMock.mockReturnValue(["mpt"]);

    const actions = accountActions.getMainActions({
      account: XRP_IOU_TOKEN_ACCOUNT,
      parentAccount: XRP_ACCOUNT_WITH_TOKEN,
    });

    expect(actions).toEqual([]);
  });

  it("shows nothing on the XRP account itself", () => {
    const actions = accountActions.getMainActions({ account: XRP_ACCOUNT_WITH_TOKEN });

    expect(actions).toEqual([]);
  });
});
