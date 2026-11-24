import BigNumber from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import {
  formatIssuerFee,
  formatLongTrustLimit,
  formatTrustLimit,
  getXrpResources,
  makeChangeTrustTransaction,
  makeOptOutTransaction,
} from "./utils";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "./__mocks__/account.mock";
import { xrpIouToken, xrpRlusdToken } from "./__mocks__/currency.mock";

const unit = xrpRlusdToken.units[0];

function toBaseUnits(value: string): BigNumber {
  return new BigNumber(value).shiftedBy(unit.magnitude);
}

function formatLimit(limit: BigNumber) {
  return formatTrustLimit({
    limit,
    unit,
    locale: "en-US",
    discreet: false,
    maximumLabel: "Maximum",
  });
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

describe("formatTrustLimit", () => {
  it("names the protocol maximum", () => {
    expect(formatLimit(MAX_TRUST_LIMIT)).toBe("Maximum");
  });

  it("shows any other limit in the token unit", () => {
    expect(formatLimit(toBaseUnits("1000"))).toMatch(/^1,000\sRLUSD$/);
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

describe("makeOptOutTransaction", () => {
  it("opts out of a held token on the parent account, with no amount", async () => {
    const bridge = await getAccountBridge(XRP_ACCOUNT);

    const transaction = makeOptOutTransaction(bridge, XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT);

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).toMatchObject({
      mode: "optOut",
      assetReference: xrpIouToken.tokenIdentifier,
      assetOwner: xrpIouToken.contractAddress,
      amount: new BigNumber(0),
    });
  });
});

describe("makeChangeTrustTransaction", () => {
  it("edits a held token's limit on the parent account, without subAccountId", async () => {
    const bridge = await getAccountBridge(XRP_ACCOUNT);

    const transaction = makeChangeTrustTransaction(bridge, XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT);

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).toMatchObject({
      mode: "changeTrust",
      assetReference: xrpIouToken.tokenIdentifier,
      assetOwner: xrpIouToken.contractAddress,
      amount: XRP_IOU_TOKEN_ACCOUNT.xrpResources?.limit,
    });
  });

  it("starts an add with no token picked and no subAccountId", async () => {
    const bridge = await getAccountBridge(XRP_ACCOUNT);

    const transaction = makeChangeTrustTransaction(bridge, XRP_ACCOUNT, undefined);

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).not.toHaveProperty("assetReference");
    expect(transaction).not.toHaveProperty("noRipple");
    expect(transaction.mode).toBe("changeTrust");
  });

  it.each([
    [true, false],
    [false, true],
    [undefined, true],
  ])("resends isRippling %s on an edit as noRipple %s", async (isRippling, noRipple) => {
    const bridge = await getAccountBridge(XRP_ACCOUNT);
    const limit = new BigNumber(1000).shiftedBy(38);
    const tokenAccount = makeXrpTokenAccount({ limit, isRippling });

    const transaction = makeChangeTrustTransaction(bridge, XRP_ACCOUNT, tokenAccount);

    expect(transaction).toMatchObject({ noRipple, mode: "changeTrust", amount: limit });
  });
});
