import { renderHook } from "@tests/test-renderer";
import { useOperationsSectionHeaderViewModel } from "../useOperationsSectionHeaderViewModel";

describe("useOperationsSectionHeaderViewModel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 'Today' for today's date", () => {
    const today = new Date(2024, 0, 15, 8, 30, 0);
    const { result } = renderHook(() => useOperationsSectionHeaderViewModel(today));
    expect(result.current.formattedDay).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday's date", () => {
    const yesterday = new Date(2024, 0, 14);
    const { result } = renderHook(() => useOperationsSectionHeaderViewModel(yesterday));
    expect(result.current.formattedDay).toBe("Yesterday");
  });

  it("returns a long formatted date string for older dates", () => {
    const oldDate = new Date(2023, 5, 20); // Jun 20, 2023
    const { result } = renderHook(() => useOperationsSectionHeaderViewModel(oldDate));
    const { formattedDay } = result.current;
    expect(typeof formattedDay).toBe("string");
    expect(formattedDay.length).toBeGreaterThan(0);
    expect(formattedDay).not.toBe("Today");
    expect(formattedDay).not.toBe("Yesterday");
  });
});
