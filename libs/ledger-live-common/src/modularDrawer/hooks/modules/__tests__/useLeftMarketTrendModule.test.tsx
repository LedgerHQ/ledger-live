/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { useLeftMarketTrendModule } from "../useLeftMarketTrendModule";
import { createEthereumCurrency, createMockStore, createWrapper } from "../../../test-helpers";

const MarketPercentIndicator = jest.fn((props: { percent: number }) =>
  React.createElement("div", { "data-testid": "market-percent-indicator", ...props }),
);

const ethereumCurrency = createEthereumCurrency();

describe("useLeftMarketTrendModule", () => {
  const store = createMockStore();
  const wrapper = createWrapper(store);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should add leftElement with market trend data when enabled is true", () => {
    const { result } = renderHook(
      () => useLeftMarketTrendModule([ethereumCurrency], MarketPercentIndicator, true),
      { wrapper },
    );

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).toHaveProperty("leftElement");
    const leftElement = (firstItem as any).leftElement;
    expect(React.isValidElement(leftElement)).toBe(true);
    expect(leftElement.props).toEqual(
      expect.objectContaining({
        percent: 5.25,
      }),
    );
  });

  it("should not add leftElement when enabled is false", () => {
    const { result } = renderHook(
      () => useLeftMarketTrendModule([ethereumCurrency], MarketPercentIndicator, false),
      { wrapper },
    );

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).not.toHaveProperty("leftElement");
  });

  it("should return currencies as-is when enabled is false", () => {
    const {
      result: { current },
    } = renderHook(
      () => useLeftMarketTrendModule([ethereumCurrency], MarketPercentIndicator, false),
      { wrapper },
    );

    expect(current).toEqual([ethereumCurrency]);
  });

  it("should use enabled=true by default", () => {
    const { result } = renderHook(
      () => useLeftMarketTrendModule([ethereumCurrency], MarketPercentIndicator),
      { wrapper },
    );

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).toHaveProperty("leftElement");
    const leftElement = (firstItem as any).leftElement;
    expect(React.isValidElement(leftElement)).toBe(true);
    expect(leftElement.props).toEqual(
      expect.objectContaining({
        percent: 5.25,
      }),
    );
  });
});
