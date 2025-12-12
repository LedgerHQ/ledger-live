import { getPercentVariant, formatPercentText } from "../useMarketPriceIndicator";

describe("getPercentVariant", () => {
  it("should return 'positive' for positive numbers", () => {
    expect(getPercentVariant(1)).toBe("positive");
    expect(getPercentVariant(0.01)).toBe("positive");
    expect(getPercentVariant(100)).toBe("positive");
  });

  it("should return 'negative' for negative numbers", () => {
    expect(getPercentVariant(-1)).toBe("negative");
    expect(getPercentVariant(-0.01)).toBe("negative");
    expect(getPercentVariant(-100)).toBe("negative");
  });

  it("should return 'neutral' for zero", () => {
    expect(getPercentVariant(0)).toBe("neutral");
  });
});

describe("formatPercentText", () => {
  it("should format positive numbers with a plus sign", () => {
    expect(formatPercentText(1)).toBe("+1%");
    expect(formatPercentText(0.5)).toBe("+0.5%");
    expect(formatPercentText(100)).toBe("+100%");
  });

  it("should format negative numbers with a minus sign", () => {
    expect(formatPercentText(-1)).toBe("-1%");
    expect(formatPercentText(-0.5)).toBe("-0.5%");
    expect(formatPercentText(-100)).toBe("-100%");
  });

  it("should format zero without a sign", () => {
    expect(formatPercentText(0)).toBe("0%");
  });
});
