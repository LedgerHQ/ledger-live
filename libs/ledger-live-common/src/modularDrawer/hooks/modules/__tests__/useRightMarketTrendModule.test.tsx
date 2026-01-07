/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { useRightMarketTrendModule } from "../useRightMarketTrendModule";
import {
  createEthereumAccount,
  createUseBalanceDeps,
  createMockStore,
  createWrapper,
} from "../../../test-helpers";

const MarketPriceIndicator = jest.fn((props: { percent: number; price: string }) =>
  React.createElement("div", { "data-testid": "market-price-indicator", ...props }),
);

const { ethereumAccount, ethereumCurrency } = createEthereumAccount();
const useBalanceDeps = createUseBalanceDeps(ethereumAccount);

describe("useRightMarketTrendModule", () => {
  const store = createMockStore();
  const wrapper = createWrapper(store);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should add rightElement with market price and percent when enabled is true", () => {
    const { result } = renderHook(
      () =>
        useRightMarketTrendModule({
          currencies: [ethereumCurrency],
          useBalanceDeps,
          MarketPriceIndicator,
          enabled: true,
        }),
      { wrapper },
    );

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).toHaveProperty("rightElement");
    const rightElement = (firstItem as any).rightElement;
    expect(React.isValidElement(rightElement)).toBe(true);
    expect(rightElement.props).toEqual(
      expect.objectContaining({
        percent: 5.25,
        price: expect.any(String),
      }),
    );
  });

  it("should not add rightElement when enabled is false", () => {
    const { result } = renderHook(
      () =>
        useRightMarketTrendModule({
          currencies: [ethereumCurrency],
          useBalanceDeps,
          MarketPriceIndicator,
          enabled: false,
        }),
      { wrapper },
    );

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).not.toHaveProperty("rightElement");
  });

  it("should return currencies as-is when enabled is false", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useRightMarketTrendModule({
          currencies: [ethereumCurrency],
          useBalanceDeps,
          MarketPriceIndicator,
          enabled: false,
        }),
      { wrapper },
    );

    expect(current).toEqual([ethereumCurrency]);
  });

  it("should use enabled=true by default", () => {
    const { result } = renderHook(
      () =>
        useRightMarketTrendModule({
          currencies: [ethereumCurrency],
          useBalanceDeps,
          MarketPriceIndicator,
        }),
      { wrapper },
    );

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).toHaveProperty("rightElement");
    const rightElement = (firstItem as any).rightElement;
    expect(React.isValidElement(rightElement)).toBe(true);
    expect(rightElement.props).toEqual(
      expect.objectContaining({
        percent: 5.25,
        price: expect.any(String),
      }),
    );
  });
});
