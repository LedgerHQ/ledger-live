/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useRightBalanceAsset } from "../useRightBalanceAsset";
import { createEthereumAccount, createUseBalanceDeps } from "../../test-helpers";

const balanceItem = jest.fn(() => null);

const { ethereumAccount, ethereumCurrency } = createEthereumAccount();
const useBalanceDeps = createUseBalanceDeps(ethereumAccount);

const assetsMap = new Map([
  [
    "ethereum",
    {
      mainCurrency: ethereumCurrency,
      currencies: [ethereumCurrency],
    },
  ],
]);

describe("useRightBalanceAsset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call balanceItem when enabled is true", () => {
    renderHook(() =>
      useRightBalanceAsset({
        assets: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        assetsMap,
        enabled: true,
      }),
    );

    expect(balanceItem).toHaveBeenCalledTimes(1);
  });

  it("should not call balanceItem when enabled is false", () => {
    renderHook(() =>
      useRightBalanceAsset({
        assets: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        assetsMap,
        enabled: false,
      }),
    );

    expect(balanceItem).not.toHaveBeenCalled();
  });

  it("should return assets as-is when enabled is false", () => {
    const {
      result: { current },
    } = renderHook(() =>
      useRightBalanceAsset({
        assets: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        assetsMap,
        enabled: false,
      }),
    );

    expect(current).toEqual([ethereumCurrency]);
  });

  it("should return assets with balance data when enabled is true", () => {
    const {
      result: { current },
    } = renderHook(() =>
      useRightBalanceAsset({
        assets: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        assetsMap,
        enabled: true,
      }),
    );

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveProperty("balanceData");
    expect(current[0]).toHaveProperty("rightElement");
  });

  it("should use enabled=true by default", () => {
    renderHook(() =>
      useRightBalanceAsset({
        assets: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        assetsMap,
      }),
    );

    expect(balanceItem).toHaveBeenCalledTimes(1);
  });
});
