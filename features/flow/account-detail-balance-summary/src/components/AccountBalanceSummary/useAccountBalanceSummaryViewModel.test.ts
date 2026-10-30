import { act, renderHook } from "@testing-library/react";
import type { BalanceItem } from "./AccountBalanceSummary.types";
import { useAccountBalanceSummaryViewModel } from "./useAccountBalanceSummaryViewModel";

const item = (id: string, description?: string): BalanceItem => ({
  id,
  label: id,
  value: "1",
  description,
});

const items = [item("a", "About a"), item("b"), item("c", "About c")];

describe("useAccountBalanceSummaryViewModel", () => {
  it("groups the items two per row", () => {
    const { result } = renderHook(() => useAccountBalanceSummaryViewModel({ items }));

    expect(result.current.cardsPerRow).toBe(2);
    expect(result.current.rows.map(row => row.map(({ id }) => id))).toEqual([["a", "b"], ["c"]]);
  });

  it("has no row without items", () => {
    const { result } = renderHook(() => useAccountBalanceSummaryViewModel({ items: [] }));

    expect(result.current.rows).toEqual([]);
  });

  it("keeps the amounts visible unless discreet mode is on", () => {
    const visible = renderHook(() => useAccountBalanceSummaryViewModel({ items }));
    const discreet = renderHook(() => useAccountBalanceSummaryViewModel({ items, discreet: true }));

    expect(visible.result.current.discreet).toBe(false);
    expect(discreet.result.current.discreet).toBe(true);
  });

  it("selects the item whose description is shown, then clears it", () => {
    const { result } = renderHook(() => useAccountBalanceSummaryViewModel({ items }));
    expect(result.current.infoItem).toBeUndefined();

    act(() => result.current.onShowDescription("c"));
    expect(result.current.infoItem?.id).toBe("c");

    act(() => result.current.onCloseInfo());
    expect(result.current.infoItem).toBeUndefined();
  });

  it("selects nothing for an unknown item", () => {
    const { result } = renderHook(() => useAccountBalanceSummaryViewModel({ items }));

    act(() => result.current.onShowDescription("unknown"));

    expect(result.current.infoItem).toBeUndefined();
  });

  it("passes the test id through", () => {
    const { result } = renderHook(() =>
      useAccountBalanceSummaryViewModel({ items, testID: "balances" }),
    );

    expect(result.current.testID).toBe("balances");
  });
});
