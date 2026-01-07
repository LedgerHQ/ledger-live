/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { useLeftApyModule } from "../useLeftApyModule";
import { createEthereumCurrency, createMockStore, createWrapper } from "../../../test-helpers";

const ApyIndicator = jest.fn((props: { value: number; type: string }) =>
  React.createElement("div", { "data-testid": "apy-indicator", ...props }),
);

const ethereumCurrency = createEthereumCurrency();

describe("useLeftApyModule", () => {
  const store = createMockStore();
  const wrapper = createWrapper(store);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should add leftElement with APY data when enabled is true", () => {
    const { result } = renderHook(() => useLeftApyModule([ethereumCurrency], ApyIndicator, true), {
      wrapper,
    });

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).toHaveProperty("leftElement");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leftElement = (firstItem as any).leftElement;
    expect(React.isValidElement(leftElement)).toBe(true);
    expect(leftElement.props).toEqual(
      expect.objectContaining({
        value: 4.5,
        type: "APY",
      }),
    );
  });

  it("should not add leftElement when enabled is false", () => {
    const { result } = renderHook(() => useLeftApyModule([ethereumCurrency], ApyIndicator, false), {
      wrapper,
    });

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).not.toHaveProperty("leftElement");
  });

  it("should return currencies as-is when enabled is false", () => {
    const {
      result: { current },
    } = renderHook(() => useLeftApyModule([ethereumCurrency], ApyIndicator, false), { wrapper });

    expect(current).toEqual([ethereumCurrency]);
  });

  it("should use enabled=true by default", () => {
    const { result } = renderHook(() => useLeftApyModule([ethereumCurrency], ApyIndicator), {
      wrapper,
    });

    expect(result.current).toHaveLength(1);
    const firstItem = result.current[0];
    expect(firstItem).toHaveProperty("leftElement");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leftElement = (firstItem as any).leftElement;
    expect(React.isValidElement(leftElement)).toBe(true);
    expect(leftElement.props).toEqual(
      expect.objectContaining({
        value: 4.5,
        type: "APY",
      }),
    );
  });
});
