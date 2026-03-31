import { renderHook } from "tests/testSetup";
import { useTable } from "../useTable";

describe("useTable", () => {
  it("omits trend header tooltip meta when showTrendColumnTooltip is false", () => {
    const { result } = renderHook(() => useTable([], { showTrendColumnTooltip: false }));
    const trendCol = result.current.getAllColumns().find(c => c.id === "trend");
    expect(trendCol?.columnDef.meta?.headerTrailingContent).toBeUndefined();
  });

  it("includes trend header tooltip meta by default", () => {
    const { result } = renderHook(() => useTable([]));
    const trendCol = result.current.getAllColumns().find(c => c.id === "trend");
    expect(trendCol?.columnDef.meta?.headerTrailingContent).toBeDefined();
  });
});
