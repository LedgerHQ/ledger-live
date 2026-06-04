import { renderHook, act } from "tests/testSetup";
import { useChartOptionsMenuViewModel } from "../useChartOptionsMenuViewModel";

function renderViewModel({
  hideTransactionsOnChart = false,
  currencyId = "bitcoin",
}: {
  hideTransactionsOnChart?: boolean;
  currencyId?: string;
} = {}) {
  return renderHook(() => useChartOptionsMenuViewModel({ currencyId }), {
    initialState: { market: { hideTransactionsOnChart } },
  });
}

describe("useChartOptionsMenuViewModel", () => {
  it("shows the 'hide' label and is not hidden by default", () => {
    const { result } = renderViewModel();
    expect(result.current.isHidden).toBe(false);
    expect(result.current.toggleLabel).toBe("Hide activity on price chart");
  });

  it("shows the 'show' label when transactions are already hidden", () => {
    const { result } = renderViewModel({ hideTransactionsOnChart: true });
    expect(result.current.isHidden).toBe(true);
    expect(result.current.toggleLabel).toBe("Show activity on price chart");
  });

  it("persists hiding transactions when toggled from the visible state", () => {
    const { result, store } = renderViewModel({ hideTransactionsOnChart: false });
    act(() => result.current.onToggle());
    expect(store.getState().market.hideTransactionsOnChart).toBe(true);
  });

  it("persists showing transactions when toggled from the hidden state", () => {
    const { result, store } = renderViewModel({ hideTransactionsOnChart: true });
    act(() => result.current.onToggle());
    expect(store.getState().market.hideTransactionsOnChart).toBe(false);
  });
});
