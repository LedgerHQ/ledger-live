import React from "react";
import type { CardTransactionFormatters, CardTransactionItem } from "../../types";
import { HistoryRowView } from "./HistoryRowView";
import { useHistoryRowViewModel } from "./useHistoryRowViewModel";

type HistoryRowProps = Readonly<{
  item: CardTransactionItem;
  formatters?: CardTransactionFormatters;
  onRowClick: (item: CardTransactionItem) => void;
}>;

export function HistoryRow({ item, formatters, onRowClick }: HistoryRowProps) {
  return (
    <HistoryRowView
      {...useHistoryRowViewModel(item, formatters)}
      onRowClick={() => onRowClick(item)}
    />
  );
}
