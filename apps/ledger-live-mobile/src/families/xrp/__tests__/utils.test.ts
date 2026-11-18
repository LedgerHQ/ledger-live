import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_REMOVAL,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
} from "../__mocks__/account.mock";
import { makeMockAccountBridge } from "../__mocks__/bridge.mock";
import { xrpIouAsset, xrpIouToken } from "../__mocks__/currency.mock";
import {
  formatIssuerFee,
  getDeleteBlocker,
  getManageableTokenAccounts,
  makeOptOutTransaction,
} from "../utils";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const getEnabledStandardsMock = jest.mocked(getXrpEnabledTokenStandards);

describe("getManageableTokenAccounts", () => {
  beforeEach(() => {
    getEnabledStandardsMock.mockReturnValue(["iou", "mpt"]);
  });

  it("returns the held tokens of every enabled standard", () => {
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT, XRP_MPT_TOKEN_ACCOUNT] };

    expect(getManageableTokenAccounts(account)).toEqual([
      XRP_IOU_TOKEN_ACCOUNT,
      XRP_MPT_TOKEN_ACCOUNT,
    ]);
  });

  it("leaves out a removed token, which has no resources", () => {
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_REMOVED_TOKEN_ACCOUNT] };

    expect(getManageableTokenAccounts(account)).toEqual([]);
  });

  it("leaves out a token whose standard is disabled", () => {
    getEnabledStandardsMock.mockReturnValue(["mpt"]);
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT, XRP_MPT_TOKEN_ACCOUNT] };

    expect(getManageableTokenAccounts(account)).toEqual([XRP_MPT_TOKEN_ACCOUNT]);
  });

  it("returns nothing while no standard is enabled", () => {
    getEnabledStandardsMock.mockReturnValue([]);

    expect(getManageableTokenAccounts(XRP_ACCOUNT_WITH_TOKEN)).toEqual([]);
  });

  it("returns nothing for an account without sub accounts", () => {
    expect(getManageableTokenAccounts({ ...XRP_ACCOUNT, subAccounts: undefined })).toEqual([]);
  });
});

describe("formatIssuerFee", () => {
  it("formats a fee percentage in the locale", () => {
    expect(formatIssuerFee("0.5", "en")).toBe("0.5%");
  });

  it("keeps the 7 decimals of an IOU fee", () => {
    expect(formatIssuerFee("0.0000001", "en")).toBe("0.0000001%");
  });
});

describe("getDeleteBlocker", () => {
  it("allows the delete of a held token", () => {
    expect(getDeleteBlocker(XRP_ACCOUNT_WITH_TOKEN, XRP_IOU_TOKEN_ACCOUNT)).toBeUndefined();
  });

  it("blocks the delete while a removal of the token is pending", () => {
    const account = { ...XRP_ACCOUNT_WITH_TOKEN, pendingOperations: [XRP_IOU_REMOVAL] };

    expect(getDeleteBlocker(account, XRP_IOU_TOKEN_ACCOUNT)).toBe("pending");
  });

  it("blocks the delete of a frozen token", () => {
    const frozen = {
      ...XRP_IOU_TOKEN_ACCOUNT,
      xrpResources: { ...XRP_IOU_TOKEN_ACCOUNT.xrpResources, isLocked: true },
    };

    expect(getDeleteBlocker(XRP_ACCOUNT_WITH_TOKEN, frozen)).toBe("frozen");
  });
});

describe("makeOptOutTransaction", () => {
  it("removes the token with an amount of 0", () => {
    const bridge = makeMockAccountBridge() as unknown as AccountBridge<Transaction>;

    expect(makeOptOutTransaction(bridge, XRP_ACCOUNT, xrpIouToken)).toMatchObject({
      mode: "optOut",
      amount: new BigNumber(0),
      ...xrpIouAsset,
    });
  });
});
