import BigNumber from "bignumber.js";
import { formatIssuerFee, formatLongTrustLimit, getXrpResources } from "./utils";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
} from "./__mocks__/account.mock";
import { XRP_TOKEN } from "./__mocks__/currency.mock";

const unit = XRP_TOKEN.units[0];

function toBaseUnits(value: string): BigNumber {
  return new BigNumber(value).shiftedBy(unit.magnitude);
}

describe("getXrpResources", () => {
  it("reads the resources of a held token", () => {
    expect(getXrpResources(XRP_IOU_TOKEN_ACCOUNT)).toBe(XRP_IOU_TOKEN_ACCOUNT.xrpResources);
  });

  it("has none for a removed token", () => {
    expect(getXrpResources(XRP_REMOVED_TOKEN_ACCOUNT)).toBeUndefined();
  });

  it("has none for the XRP account or no account", () => {
    expect(getXrpResources(XRP_ACCOUNT)).toBeUndefined();
    expect(getXrpResources(undefined)).toBeUndefined();
  });
});

describe("formatLongTrustLimit", () => {
  it("keeps every significant digit of a limit above 16 integer digits", () => {
    const formatted = formatLongTrustLimit(toBaseUnits("9999999999999999e79"), unit, "en-US");

    expect(formatted).toBe(`9.999999999999999e94 ${unit.code}`);
  });

  it("uses the decimal separator of the locale", () => {
    expect(formatLongTrustLimit(toBaseUnits("15e19"), unit, "fr-FR")).toBe(`1,5e20 ${unit.code}`);
  });

  it("returns null for a limit of 16 integer digits", () => {
    expect(formatLongTrustLimit(toBaseUnits("9999999999999999"), unit, "en-US")).toBeNull();
  });

  it("formats a limit of 17 integer digits", () => {
    expect(formatLongTrustLimit(toBaseUnits("1e16"), unit, "en-US")).toBe(`1e16 ${unit.code}`);
  });
});

describe("formatIssuerFee", () => {
  it.each([
    ["0", "en-US", "0%"],
    ["0.5", "en-US", "0.5%"],
    ["0.5", "fr-FR", "0,5\u00a0%"],
    ["0.0000001", "en-US", "0.0000001%"],
  ])("formats %s in %s as %s", (fee, locale, formatted) => {
    expect(formatIssuerFee(fee, locale)).toBe(formatted);
  });
});
