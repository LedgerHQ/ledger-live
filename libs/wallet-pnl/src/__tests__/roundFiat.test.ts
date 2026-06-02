import { BigNumber } from "bignumber.js";
import { roundFiatAtoms } from "../roundFiat";

describe("roundFiatAtoms", () => {
  it("rounds a sub-atom residual down to zero", () => {
    // -0.3127 cents == -$0.003, which displays as $0.00
    expect(roundFiatAtoms(new BigNumber("-0.3127636356978839")).toString()).toBe("0");
    expect(roundFiatAtoms(new BigNumber(0.49)).toString()).toBe("0");
  });

  it("collapses a negative residual to a true zero (no '-0' → '-$0.00')", () => {
    const rounded = roundFiatAtoms(new BigNumber("-0.3127636356978839"));
    expect(rounded.isZero()).toBe(true);
    expect(rounded.isNegative()).toBe(false);
  });

  it("rounds to the nearest whole atom", () => {
    expect(roundFiatAtoms(new BigNumber(0.6)).toString()).toBe("1");
    expect(roundFiatAtoms(new BigNumber(-0.6)).toString()).toBe("-1");
    expect(roundFiatAtoms(new BigNumber(0.5)).toString()).toBe("1");
    expect(roundFiatAtoms(new BigNumber(-0.5)).toString()).toBe("-1");
  });

  it("leaves whole-atom amounts untouched", () => {
    expect(roundFiatAtoms(new BigNumber(1234567)).toString()).toBe("1234567");
    expect(roundFiatAtoms(new BigNumber(-50)).toString()).toBe("-50");
  });
});
