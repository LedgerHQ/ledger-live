import { isValidElement } from "react";
import type { HeaderContext } from "@tanstack/react-table";
import { renderHook } from "tests/testSetup";
import { TruncatedText } from "LLD/components/TruncatedText";
import { useTable } from "../useTable";
import type { AssetTableItem } from "../../types";

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

  it("should expose the full trend column label", () => {
    const { result } = renderHook(() => useTable([]));
    const header = result.current.getAllColumns().find(c => c.id === "trend")?.columnDef.header;

    expect(typeof header).toBe("function");
    if (typeof header !== "function") return;

    const element = header({} as HeaderContext<AssetTableItem, unknown>);

    expect(isValidElement(element) && element.type === TruncatedText).toBe(true);
    expect(isValidElement(element) && element.props).toMatchObject({
      as: "span",
      text: "1D Trend",
    });
  });
});
