import { act, renderHook } from "@testing-library/react-native";
import { useAnalyticsFilterSheetViewModel } from "./useAnalyticsFilterSheetViewModel";

function renderSheet() {
  const props = { onOpenChange: jest.fn(), onValueChange: jest.fn() };
  const view = renderHook(() => useAnalyticsFilterSheetViewModel(props));
  return { ...view, props };
}

describe("useAnalyticsFilterSheetViewModel", () => {
  it("should open and close the sheet and report both", () => {
    const { result, props } = renderSheet();
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    expect(props.onOpenChange).toHaveBeenLastCalledWith(true);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(props.onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("should close the sheet and report the picked value", () => {
    const { result, props } = renderSheet();
    act(() => result.current.open());
    act(() => result.current.selectOption("btc"));
    expect(result.current.isOpen).toBe(false);
    expect(props.onValueChange).toHaveBeenCalledWith("btc");
  });

  it("should only close the sheet when the list clears its value", () => {
    const { result, props } = renderSheet();
    act(() => result.current.open());
    act(() => result.current.selectOption(null));
    expect(result.current.isOpen).toBe(false);
    expect(props.onValueChange).not.toHaveBeenCalled();
  });
});
