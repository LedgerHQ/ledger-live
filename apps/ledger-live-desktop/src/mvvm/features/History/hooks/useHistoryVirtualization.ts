import { useRef, useMemo } from "react";
import { useVirtualizer, Virtualizer } from "@tanstack/react-virtual";
import type { VirtualItem, HistoryTable } from "../types";

const OPERATION_ROW_HEIGHT = 64;
const DAY_HEADER_HEIGHT = 40;
const OVERSCAN = 10;

export { OPERATION_ROW_HEIGHT, DAY_HEADER_HEIGHT };

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildFlatItems(table: HistoryTable): VirtualItem[] {
  const rowModel = table.getRowModel();
  const items: VirtualItem[] = [];
  let currentDayKey: string | null = null;
  const columnCount = table.getVisibleFlatColumns().length;

  for (const row of rowModel.rows) {
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

  const rowModel = table.getRowModel();
  const columns = table.getVisibleFlatColumns();
  const flatItems = useMemo(() => buildFlatItems(table), [rowModel.rows, columns]);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: index => {
      const item = flatItems[index];
      return item?.type === "day-header" ? DAY_HEADER_HEIGHT : OPERATION_ROW_HEIGHT;
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
