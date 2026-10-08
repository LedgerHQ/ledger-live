import BigNumber from "bignumber.js";
import { getShieldMaxDecimals, parseShieldAmount } from "../utils/shieldAmount";

const PUBLIC_BALANCE = new BigNumber(75_000_000);

describe("parseShieldAmount", () => {
  it("converts the amount to the underlying's base units", () => {
    expect(parseShieldAmount("1.5", 6, 1n, PUBLIC_BALANCE)).toEqual({ amount: 1_500_000n });
  });

  it("accepts the whole public balance", () => {
    expect(parseShieldAmount("75", 6, 1n, PUBLIC_BALANCE)).toEqual({ amount: 75_000_000n });
  });

  it("reports no error while the field is empty", () => {
    expect(parseShieldAmount("", 6, 1n, PUBLIC_BALANCE)).toEqual({ error: null });
  });

  it.each([
    ["abc", "invalid"],
    ["-1", "invalid"],
    ["0", "zero"],
    ["75.000001", "exceedsBalance"],
    ["1.0000001", "tooPrecise"],
  ] as const)("rejects %s as %s", (input, error) => {
    expect(parseShieldAmount(input, 6, 1n, PUBLIC_BALANCE)).toEqual({ error });
  });

  it("refuses precision the wrapper cannot hold when the rate scales the amount", () => {
    expect(parseShieldAmount("0.0000001", 18, 10n ** 12n, PUBLIC_BALANCE)).toEqual({
      error: "tooPrecise",
    });
  });
});

describe("getShieldMaxDecimals", () => {
  it("keeps the underlying's decimals at rate 1", () => {
    expect(getShieldMaxDecimals(6, 1n)).toBe(6);
  });

  it("drops the decimals the rate removes", () => {
    expect(getShieldMaxDecimals(18, 10n ** 12n)).toBe(6);
  });
});
