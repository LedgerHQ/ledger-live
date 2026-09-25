import { renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useCardHistoryViewModel } from "../useCardHistoryViewModel";

const navigation = { dispatch: jest.fn() };

describe("useCardHistoryViewModel", () => {
  it("hides card amounts in discreet mode, including transaction details", () => {
    const { result } = renderHook(() => useCardHistoryViewModel(navigation), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: { ...state.settings, discreetMode: true },
      }),
    });

    expect(result.current.formatters.amount?.("-12.99", "EUR", "fiat")).toContain("***");
  });
});
