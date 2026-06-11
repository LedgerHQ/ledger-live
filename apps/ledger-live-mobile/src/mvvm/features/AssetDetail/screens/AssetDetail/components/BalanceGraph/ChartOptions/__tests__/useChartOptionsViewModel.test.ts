import { renderHook, act } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useChartOptionsViewModel } from "../useChartOptionsViewModel";

const withHidden = (hideTransactionsOnChart: boolean) => (state: State) => ({
  ...state,
  market: { ...state.market, hideTransactionsOnChart },
});

describe("useChartOptionsViewModel", () => {
  it("is not hidden and shows the 'hide' label by default", () => {
    const { result } = renderHook(() => useChartOptionsViewModel({ currencyId: "bitcoin" }), {
      overrideInitialState: withHidden(false),
    });
    expect(result.current.isHidden).toBe(false);
    expect(result.current.toggleTransactionsTitle).toBe("Hide activity on price chart");
  });

  it("shows the 'show' label when transactions are already hidden", () => {
    const { result } = renderHook(() => useChartOptionsViewModel({ currencyId: "bitcoin" }), {
      overrideInitialState: withHidden(true),
    });
    expect(result.current.isHidden).toBe(true);
    expect(result.current.toggleTransactionsTitle).toBe("Show activity on price chart");
  });

  it("opens and closes the options sheet", () => {
    const { result } = renderHook(() => useChartOptionsViewModel({ currencyId: "bitcoin" }), {
      overrideInitialState: withHidden(false),
    });
    expect(result.current.isSheetOpen).toBe(false);
    act(() => result.current.openSheet());
    expect(result.current.isSheetOpen).toBe(true);
    act(() => result.current.closeSheet());
    expect(result.current.isSheetOpen).toBe(false);
  });

  it("persists the toggle and closes the sheet when toggled", () => {
    const { result, store } = renderHook(
      () => useChartOptionsViewModel({ currencyId: "bitcoin" }),
      { overrideInitialState: withHidden(false) },
    );
    act(() => result.current.openSheet());
    act(() => result.current.onToggleTransactions());
    expect(store.getState().market.hideTransactionsOnChart).toBe(true);
    expect(result.current.isSheetOpen).toBe(false);
  });
});
