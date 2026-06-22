import { renderHook } from "tests/testSetup";
import { useTrendCellViewModel } from "../useTrendCellViewModel";

describe("useTrendCellViewModel", () => {
  it("should return formatted positive percentage with + prefix and success color", () => {
    const { result } = renderHook(() => useTrendCellViewModel(0.023));

    expect(result.current.formattedTrend).toBe("+2.30%");
    expect(result.current.colorClass).toBe("text-success");
  });

  it("should return formatted negative percentage with error color", () => {
    const { result } = renderHook(() => useTrendCellViewModel(-0.015));

    expect(result.current.formattedTrend).toBe("-1.50%");
    expect(result.current.colorClass).toBe("text-error");
  });

  it("should return '-' with muted color when percentage is null", () => {
    const { result } = renderHook(() => useTrendCellViewModel(null));

    expect(result.current.formattedTrend).toBe("-");
    expect(result.current.colorClass).toBe("text-muted");
  });

  it("should return '-' with muted color when percentage is undefined", () => {
    const { result } = renderHook(() => useTrendCellViewModel(undefined));

    expect(result.current.formattedTrend).toBe("-");
    expect(result.current.colorClass).toBe("text-muted");
  });

  it("should return 0.00% with muted color for zero percentage", () => {
    const { result } = renderHook(() => useTrendCellViewModel(0));

    expect(result.current.formattedTrend).toBe("0.00%");
    expect(result.current.colorClass).toBe("text-muted");
  });

  it("should return '***' when discreet mode is enabled", () => {
    const { result } = renderHook(() => useTrendCellViewModel(1), {
      initialState: { settings: { discreetMode: true } },
    });

    expect(result.current.formattedTrend).toBe("***");
    expect(result.current.colorClass).toBe("text-success");
  });
});
