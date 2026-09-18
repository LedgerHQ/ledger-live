import type { ReactNode } from "react";
import type { CardTransactionFormatters, CardTransactionItem } from "../types";
import type { CardTransactionHistoryUiState } from "./cardTransactionHistoryUiState";

export type CardTransactionHistoryColumnSet = "card" | "asset";

export type CardTransactionHistoryProps = Readonly<{
  formatters?: CardTransactionFormatters;
  filterTransaction?: (item: CardTransactionItem) => boolean;
  /** `asset` is Transaction / Value / Amount; `card` keeps funding sources. */
  columnSet?: CardTransactionHistoryColumnSet;
  assetCode?: string;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
  formatDay?: (date: Date) => string;
  onGoToPay?: () => void;
  cardVisual?: ReactNode;
}>;

export type CardTransactionHistoryViewProps = Readonly<{
  displayState: CardTransactionHistoryUiState;
  formatters?: CardTransactionFormatters;
  columnSet?: CardTransactionHistoryColumnSet;
  assetCode?: string;
  formatDay?: (date: Date) => string;
  onRowClick: (item: CardTransactionItem) => void;
  onGoToPay?: () => void;
  cardVisual?: ReactNode;
}>;
