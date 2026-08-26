import React from "react";
import { flexRender } from "@tanstack/react-table";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, renderHook, screen } from "tests/testSetup";
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

  it("renders an unavailable precomputed value instead of recalculating an aggregated row", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    const { result } = renderHook(() =>
      useTable([
        {
          currency: bitcoin,
          balance: 100_000_000,
          value: undefined,
          distribution: 0,
          accounts: [],
          isPlaceholder: false,
        },
      ]),
    );
    const cell = result.current
      .getRowModel()
      .rows[0].getVisibleCells()
      .find(({ column }) => column.id === "value");
    if (!cell) throw new Error("Missing value cell");

    render(<>{flexRender(cell.column.columnDef.cell, cell.getContext())}</>);

    expect(screen.getByTestId("w40-asset-row-value-bitcoin-bitcoin")).toHaveTextContent("-");
  });
});
