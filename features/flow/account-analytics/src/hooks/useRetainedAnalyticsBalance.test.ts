import { renderHook } from "@testing-library/react";
import type { AnalyticsBalanceData, AnalyticsResultState } from "../types";
import { useRetainedAnalyticsBalance } from "./useRetainedAnalyticsBalance";

type Balance = AnalyticsResultState<AnalyticsBalanceData>;

const createBalanceData = (amount: number): AnalyticsBalanceData => ({
  amount,
  variation: { amount: 1, ratio: 0.1 },
  history: [{ timestamp: 1, amount }],
});

const loading: Balance = { status: "loading" };
const first = createBalanceData(100);
const second = createBalanceData(200);

function renderRetainedBalance(initial: Balance) {
  return renderHook(({ balance }) => useRetainedAnalyticsBalance(balance), {
    initialProps: { balance: initial },
  });
}

describe("useRetainedAnalyticsBalance", () => {
  it("should have no data during the first load", () => {
    const { result } = renderRetainedBalance(loading);
    expect(result.current).toEqual({ data: undefined, isStale: false });
  });

  it("should keep the last ready balance while the next one loads", () => {
    const { result, rerender } = renderRetainedBalance({ status: "ready", data: first });
    rerender({ balance: loading });
    expect(result.current).toEqual({ data: first, isStale: true });
    rerender({ balance: { status: "ready", data: second } });
    expect(result.current).toEqual({ data: second, isStale: false });
  });

  it("should drop the retained balance once a selection is unavailable", () => {
    const { result, rerender } = renderRetainedBalance({ status: "ready", data: first });
    rerender({ balance: { status: "unavailable" } });
    expect(result.current).toEqual({ data: undefined, isStale: false });
    rerender({ balance: loading });
    expect(result.current).toEqual({ data: undefined, isStale: false });
  });

  it("should drop the retained balance after an error", () => {
    const { result, rerender } = renderRetainedBalance({ status: "ready", data: first });
    rerender({ balance: { status: "error" } });
    rerender({ balance: loading });
    expect(result.current).toEqual({ data: undefined, isStale: false });
  });
});
