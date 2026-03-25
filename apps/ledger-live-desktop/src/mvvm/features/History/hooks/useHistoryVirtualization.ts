import { useRef, useMemo } from "react";
import { useVirtualizer, Virtualizer } from "@tanstack/react-virtual";
import type { VirtualItem, HistoryTable, OperationRow } from "../types";

const OPERATION_ROW_HEIGHT = 64;
const DAY_HEADER_HEIGHT = 40;
const OVERSCAN = 10;

export { OPERATION_ROW_HEIGHT, DAY_HEADER_HEIGHT };

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildFlatItems(rows: OperationRow[], columnCount: number): VirtualItem[] {
  const items: VirtualItem[] = [];

  const pendingRows = rows.filter(row => row.original.isPending);
  const confirmedRows = rows.filter(row => !row.original.isPending);

  if (pendingRows.length > 0) {
    items.push({
      type: "section-header",
      labelKey: "history.pending",
      count: pendingRows.length,
      columnCount,
    });
    for (const row of pendingRows) {
      items.push({ type: "operation", row });
    }
  }

  let currentDayKey: string | null = null;
  for (const row of confirmedRows) {
    const day = startOfDay(row.original.date);
    const dayKey = day.toISOString();
    if (dayKey !== currentDayKey) {
      items.push({ type: "day-header", day, columnCount });
      currentDayKey = dayKey;
    }
    items.push({ type: "operation", row });
  }

  return items;
}

export function useHistoryVirtualization(table: HistoryTable) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleFlatColumns().length;
  const flatItems = useMemo(() => buildFlatItems(rows, columnCount), [rows, columnCount]);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: index => {
      const item = flatItems[index];
      return item?.type === "operation" ? OPERATION_ROW_HEIGHT : DAY_HEADER_HEIGHT;
    },
    overscan: OVERSCAN,
    paddingEnd: 32,
  });

  return {
    parentRef,
    rowVirtualizer,
    flatItems,
  };
}

export type HistoryVirtualization = {
  parentRef: React.RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  flatItems: VirtualItem[];
};
