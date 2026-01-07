/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useRightBalanceNetwork } from "../useRightBalanceNetwork";
import { createEthereumAccount, createUseBalanceDeps } from "../../test-helpers";

const balanceItem = jest.fn(() => null);

const { ethereumAccount, ethereumCurrency } = createEthereumAccount();
const useBalanceDeps = createUseBalanceDeps(ethereumAccount);

describe("useRightBalanceNetwork", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call balanceItem when enabled is true", () => {
    renderHook(() =>
      useRightBalanceNetwork({
        networks: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        enabled: true,
      }),
    );

    expect(balanceItem).toHaveBeenCalledTimes(1);
  });

  it("should not call balanceItem when enabled is false", () => {
    renderHook(() =>
      useRightBalanceNetwork({
        networks: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        enabled: false,
      }),
    );

    expect(balanceItem).not.toHaveBeenCalled();
  });

  it("should return empty objects when enabled is false", () => {
    const {
      result: { current },
    } = renderHook(() =>
      useRightBalanceNetwork({
        networks: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        enabled: false,
      }),
    );

    expect(current).toHaveLength(1);
    expect(current[0]).toEqual({});
  });

  it("should return networks with balance data when enabled is true", () => {
    const {
      result: { current },
    } = renderHook(() =>
      useRightBalanceNetwork({
        networks: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
        enabled: true,
      }),
    );

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveProperty("balanceData");
    expect(current[0]).toHaveProperty("rightElement");
  });

  it("should use enabled=true by default", () => {
    renderHook(() =>
      useRightBalanceNetwork({
        networks: [ethereumCurrency],
        useBalanceDeps,
        balanceItem,
      }),
    );

    expect(balanceItem).toHaveBeenCalledTimes(1);
  });
});
