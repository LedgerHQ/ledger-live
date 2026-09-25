import { renderHook } from "tests/testSetup";
import { useCardHistoryViewModel } from "../useCardHistoryViewModel";

describe("useCardHistoryViewModel", () => {
  it("hides card amounts in discreet mode, including transaction details", () => {
    const { result } = renderHook(() => useCardHistoryViewModel(), {
      initialState: { settings: { discreetMode: true } },
    });

    expect(result.current.formatters.amount?.("-12.99", "EUR", "fiat")).toContain("***");
  });
});
