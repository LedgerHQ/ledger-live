import React from "react";
import { render, screen } from "@testing-library/react";
import { MarketPriceIndicator } from "../MarketPriceIndicator";
import { MarketPercentIndicator } from "../MarketPercentIndicator";
import { getPercentVariant, formatPercentText } from "../useMarketIndicator";

describe("useMarketIndicator utilities", () => {
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
});

describe("MarketPriceIndicator", () => {
  it("should render price and positive percent correctly", () => {
    render(<MarketPriceIndicator price="$100.00" percent={5.5} />);

    expect(screen.getByTestId("market-price-indicator-value")).toHaveTextContent("$100.00");
    expect(screen.getByTestId("market-price-indicator-percent")).toHaveTextContent("+5.5%");
  });

  it("should render price and negative percent correctly", () => {
    render(<MarketPriceIndicator price="$50.00" percent={-2.3} />);

    expect(screen.getByTestId("market-price-indicator-value")).toHaveTextContent("$50.00");
    expect(screen.getByTestId("market-price-indicator-percent")).toHaveTextContent("-2.3%");
  });

  it("should render price and zero percent correctly", () => {
    render(<MarketPriceIndicator price="$75.00" percent={0} />);

    expect(screen.getByTestId("market-price-indicator-value")).toHaveTextContent("$75.00");
    expect(screen.getByTestId("market-price-indicator-percent")).toHaveTextContent("0%");
  });
});

describe("MarketPercentIndicator", () => {
  it("should render positive percent correctly", () => {
    render(<MarketPercentIndicator percent={10} />);

    expect(screen.getByTestId("market-percent-indicator-value")).toHaveTextContent("+10%");
  });

  it("should render negative percent correctly", () => {
    render(<MarketPercentIndicator percent={-7.5} />);

    expect(screen.getByTestId("market-percent-indicator-value")).toHaveTextContent("-7.5%");
  });

  it("should render zero percent correctly", () => {
    render(<MarketPercentIndicator percent={0} />);

    expect(screen.getByTestId("market-percent-indicator-value")).toHaveTextContent("0%");
  });
});
