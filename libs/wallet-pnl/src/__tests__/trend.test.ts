import { BigNumber } from "bignumber.js";
import { trendFromSign } from "../trend";

describe("trendFromSign", () => {
  it("returns 'neutral' when the value is zero", () => {
    expect(trendFromSign(new BigNumber(0))).toBe("neutral");
  });

  it("returns 'up' when the value is positive", () => {
    expect(trendFromSign(new BigNumber(42))).toBe("up");
  });

  it("returns 'down' when the value is negative", () => {
    expect(trendFromSign(new BigNumber(-42))).toBe("down");
  });
});
