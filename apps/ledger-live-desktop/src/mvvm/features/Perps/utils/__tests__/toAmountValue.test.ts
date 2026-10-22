import BigNumber from "bignumber.js";
import { toAmountValue } from "../toAmountValue";

describe("toAmountValue", () => {
  it("shifts an atomic amount down by the magnitude as a plain decimal", () => {
    expect(toAmountValue(new BigNumber("123450000"), 6)).toBe("123.45");
  });

  it("never switches to exponent notation", () => {
    expect(toAmountValue(new BigNumber("1"), 18)).toBe("0.000000000000000001");
  });
});
