import { isValidElement } from "react";
import type { HeaderContext } from "@tanstack/react-table";
import { renderHook } from "tests/testSetup";
import { TruncatedText } from "LLD/components/TruncatedText";
import { useAssetsTable } from "../useAssetsTable";
import type { AssetTableItem } from "../types";

describe("useAssetsTable", () => {
  it("omits trend header tooltip meta when showTrendColumnTooltip is false", () => {
    const { result } = renderHook(() => useAssetsTable([], { showTrendColumnTooltip: false }));
    const trendCol = result.current.getAllColumns().find(c => c.id === "trend");
    expect(trendCol?.columnDef.meta?.headerTrailingContent).toBeUndefined();
  });

  it("includes trend header tooltip meta by default", () => {
    const { result } = renderHook(() => useAssetsTable([]));
    const trendCol = result.current.getAllColumns().find(c => c.id === "trend");
    expect(trendCol?.columnDef.meta?.headerTrailingContent).toBeDefined();
  });

  it("shows the price column by default", () => {
    const { result } = renderHook(() => useAssetsTable([]));

    expect(result.current.getColumn("price")?.getIsVisible()).toBe(true);
  });

  it("hides the price column when showPriceColumn is false", () => {
    const { result } = renderHook(() => useAssetsTable([], { showPriceColumn: false }));

    expect(result.current.getColumn("price")?.getIsVisible()).toBe(false);
    expect(result.current.getVisibleLeafColumns().map(({ id }) => id)).toEqual([
      "currency",
      "balance",
      "value",
      "trend",
    ]);
  });

  it("should expose the full trend column label", () => {
    const { result } = renderHook(() => useAssetsTable([]));
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
