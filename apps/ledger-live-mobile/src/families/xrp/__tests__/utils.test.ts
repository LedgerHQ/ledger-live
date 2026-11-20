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
  applyTrustLineEdit,
  formatIssuerFee,
  formatLimitText,
  getDeleteBlocker,
  getManageableTokenAccounts,
  makeOptOutTransaction,
  parseLimitText,
  readLimitInput,
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
  it("builds an opt-out of the token", () => {
    const bridge = makeMockAccountBridge() as unknown as AccountBridge<Transaction>;

    expect(makeOptOutTransaction(bridge, XRP_ACCOUNT, xrpIouToken)).toMatchObject({
      mode: "optOut",
      ...xrpIouAsset,
    });
  });
});

describe("applyTrustLineEdit", () => {
  const edit = { limit: new BigNumber(2000), isRippling: true };

  it("sets the limit and rippling of the edited token and keeps its other resources", () => {
    const account = applyTrustLineEdit(XRP_ACCOUNT_WITH_TOKEN, XRP_IOU_TOKEN_ACCOUNT.id, edit);

    expect(account.subAccounts).toEqual([
      expect.objectContaining({ xrpResources: { isLocked: false, ...edit } }),
    ]);
  });

  it("leaves the other token accounts as they are", () => {
    const account = applyTrustLineEdit(
      { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT, XRP_MPT_TOKEN_ACCOUNT] },
      XRP_IOU_TOKEN_ACCOUNT.id,
      edit,
    );

    expect(account.subAccounts).toEqual([expect.anything(), XRP_MPT_TOKEN_ACCOUNT]);
  });
});

describe("formatLimitText", () => {
  it("groups the integer digits with the locale's separator", () => {
    expect(formatLimitText("1234567", "en")).toBe("1,234,567");
    expect(formatLimitText("1234567", "de")).toBe("1.234.567");
  });

  it("keeps a decimal separator typed last, and what follows it", () => {
    expect(formatLimitText("1234.", "en")).toBe("1,234.");
    expect(formatLimitText("1234,5", "de")).toBe("1.234,5");
  });

  it("reads a point or a comma typed last as the decimal point, whatever the locale groups with", () => {
    expect(formatLimitText("1,", "en")).toBe("1.");
    expect(formatLimitText("1,000,", "en")).toBe("1,000.");
    expect(formatLimitText("1.", "de")).toBe("1,");
    expect(formatLimitText("1.000.", "de")).toBe("1.000,");
  });

  it("ignores a second decimal point", () => {
    expect(formatLimitText("1.5.", "en")).toBe("1.5");
    expect(formatLimitText("1,5,", "de")).toBe("1,5");
  });

  it("regroups text that is already grouped", () => {
    expect(formatLimitText("1,2345", "en")).toBe("12,345");
  });

  it("drops what is not a digit or a separator", () => {
    expect(formatLimitText("1a2 3", "en")).toBe("123");
    expect(formatLimitText("", "en")).toBe("");
  });
});

describe("parseLimitText", () => {
  const unit = { name: "RLUSD", code: "RLUSD", magnitude: 2 };

  it("reads a grouped amount in the token unit", () => {
    expect(parseLimitText(unit, "1,234.5", "en").toFixed()).toBe("123450");
    expect(parseLimitText(unit, "1.234,5", "de").toFixed()).toBe("123450");
  });

  it("reads an empty text as 0", () => {
    expect(parseLimitText(unit, "", "en").toFixed()).toBe("0");
  });
});

describe("readLimitInput", () => {
  it("reads a digit typed first, or after the ticker, as part of the number", () => {
    expect(readLimitInput("5", "", "RLUSD")).toBe("5");
    expect(readLimitInput("1,000 RLUSD5", "1,000", "RLUSD")).toBe("1,0005");
  });

  it("reads a digit typed inside the number", () => {
    expect(readLimitInput("1,0500 RLUSD", "1,000", "RLUSD")).toBe("1,0500");
  });

  it("reads a backspace on the ticker as the removal of the last digit", () => {
    expect(readLimitInput("1,000 RLUS", "1,000", "RLUSD")).toBe("1,00");
  });

  it("reads a field emptied or replaced as what is left in it", () => {
    expect(readLimitInput("", "1,000", "RLUSD")).toBe("");
    expect(readLimitInput("7", "1,000", "RLUSD")).toBe("7");
  });
});
