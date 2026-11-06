import { BigNumber } from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { sendFeatures } from "../../../bridge/descriptor/send/features";

const xrp = getCryptoCurrencyById("ripple");

function makeXrpToken(tokenType: string) {
  return {
    tokenType,
    type: "TokenCurrency",
    parentCurrencyId: "ripple",
  } as TokenCurrency;
}

describe("xrp send amount descriptor", () => {
  it("allows send max for a token only", () => {
    expect(sendFeatures.canSendMax(xrp)).toBe(false);
    expect(sendFeatures.canSendMax(makeXrpToken("iou"))).toBe(true);
    expect(sendFeatures.canSendMax(makeXrpToken("mpt"))).toBe(true);
  });

  it("rounds an IOU amount down to 16 significant digits", () => {
    const amount = new BigNumber("123456789012345678999e30");

    expect(sendFeatures.roundAmount(makeXrpToken("iou"), amount).toFixed()).toBe(
      new BigNumber("1234567890123456e35").toFixed(),
    );
  });

  it.each([
    ["an MPT", makeXrpToken("mpt")],
    ["XRP", xrp],
  ])("leaves the amount of %s unchanged", (_, currency) => {
    const amount = new BigNumber("123456789012345678999.5");

    expect(sendFeatures.roundAmount(currency, amount)).toBe(amount);
  });
});
