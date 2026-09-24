import { act, renderHook } from "@testing-library/react";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { useCardDetailsNavigation } from "./navigation";

const usdc: CardAssetRow = {
  id: "w-usdc",
  currency: "usdc",
  network: "ethereum",
  name: "USD Coin",
  ticker: "USDC",
  ledgerId: "ethereum/erc20/usd__coin",
  cryptoAmount: "125.40 USDC",
  countervalue: "$125.40",
  countervalueAmount: 125.4,
};

describe("useCardDetailsNavigation", () => {
  it("should start on the overview scene", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    expect(result.current.route).toEqual({ name: "overview" });
  });

  it("should show the latest scene when going to another one", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    act(() => result.current.goTo({ name: "freeze" }));
    expect(result.current.route).toEqual({ name: "freeze" });

    act(() => result.current.goTo({ name: "more" }));
    expect(result.current.route).toEqual({ name: "more" });
  });

  it("should return to overview on goBack", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    act(() => result.current.goTo({ name: "more" }));
    act(() => result.current.goBack());

    expect(result.current.route).toEqual({ name: "overview" });
  });

  it("should keep a stable overview when going back from overview", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    act(() => result.current.goBack());

    expect(result.current.route).toEqual({ name: "overview" });
  });

  it("should pop nested scenes one at a time", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    act(() => result.current.goTo({ name: "assetDetails", asset: usdc }));
    act(() => result.current.goTo({ name: "assetWithdraw", asset: usdc }));
    act(() => result.current.goBack());

    expect(result.current.route).toEqual({ name: "assetDetails", asset: usdc });

    act(() => result.current.goBack());

    expect(result.current.route).toEqual({ name: "overview" });
  });

  it("should return to overview on reset from a nested scene", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    act(() => result.current.goTo({ name: "assetDetails", asset: usdc }));
    act(() => result.current.goTo({ name: "assetWithdraw", asset: usdc }));
    act(() => result.current.reset());

    expect(result.current.route).toEqual({ name: "overview" });
  });
});
